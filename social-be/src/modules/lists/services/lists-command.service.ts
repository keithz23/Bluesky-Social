import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  CleanupJobData,
  JOB_NAMES,
  QUEUE_NAMES,
} from 'src/common/constants/queue.constant';
import { UploadResult } from 'src/common/interfaces/file-upload.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { S3Service } from 'src/uploads/s3.service';
import { CreateListDto } from '../dto/requests/create-list.dto';
import { UpdateListDto } from '../dto/requests/update-list.dto';

@Injectable()
export class ListsCommandService {
  private readonly logger = new Logger(ListsCommandService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    @InjectQueue(QUEUE_NAMES.CLEANUP)
    private cleanupQueue: Queue<CleanupJobData>,
  ) {}

  async createList(
    userId: string,
    createListDto: CreateListDto,
    listFile: Express.Multer.File,
  ) {
    const { name, description } = createListDto;
    let uploadResults: UploadResult[] = [];
    const uploadedKeys: string[] = [];
    let photoUrl: string | undefined = undefined;

    if (listFile) {
      try {
        uploadResults = await this.s3Service.uploadImages(
          [listFile],
          `public/list/${userId}`,
          { resize: true, quality: 85 },
        );

        uploadedKeys.push(...uploadResults.map((result) => result.key));
        photoUrl = uploadResults[0]?.url;
      } catch (error) {
        this.logger.error('Error uploading images', error);
        throw new Error('Failed to upload image');
      }
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        return tx.list.create({
          data: {
            name,
            description,
            userId,
            ...(photoUrl && { listPhoto: photoUrl }),
          },
        });
      });
    } catch (error) {
      if (uploadedKeys.length > 0) {
        await this.scheduleCleanup(uploadedKeys, 'transaction_failed');
        this.logger.warn(
          `Scheduled cleanup for ${uploadedKeys.length} orphaned files`,
        );
      }
      throw error;
    }
  }

  async updateList(
    userId: string,
    updateListDto: UpdateListDto,
    listFile?: Express.Multer.File,
  ) {
    const { name, description, listId } = updateListDto;

    const existingList = await this.prisma.list.findUnique({
      where: { id: listId, userId },
    });

    if (!existingList) {
      throw new ForbiddenException('List not found or you are not the owner');
    }

    if (name && name !== existingList.name) {
      const nameTaken = await this.prisma.list.findFirst({
        where: {
          name,
          id: { not: listId },
        },
      });

      if (nameTaken) {
        throw new BadRequestException('List name already exists');
      }
    }

    let photoUrl: string | undefined = undefined;
    let newUploadedKey: string | null = null;

    if (listFile) {
      try {
        const uploadResults = await this.s3Service.uploadImages(
          [listFile],
          `public/list/${userId}`,
          { resize: true, quality: 85 },
        );

        photoUrl = uploadResults[0]?.url;
        newUploadedKey = uploadResults[0]?.key;
      } catch (error) {
        this.logger.error('Error uploading images', error);
        throw new Error('Failed to upload image');
      }
    }

    try {
      const updatedList = await this.prisma.list.update({
        where: { id: listId, userId },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(photoUrl && { listPhoto: photoUrl }),
        },
      });

      if (photoUrl && existingList.listPhoto) {
        const oldKey = this.s3Service.extractKeyFromUrl(existingList.listPhoto);
        if (oldKey) {
          this.scheduleCleanup([oldKey], 'replaced_by_new_upload').catch(
            (err) =>
              this.logger.warn('Failed to schedule old image cleanup', err),
          );
        }
      }

      return updatedList;
    } catch (error) {
      if (newUploadedKey) {
        this.scheduleCleanup([newUploadedKey], 'db_update_failed').catch(
          (err) =>
            this.logger.warn('Failed to cleanup new image after DB error', err),
        );
      }
      throw error;
    }
  }

  async deleteList(userId: string, listId: string) {
    const existingList = await this.prisma.list.findUnique({
      where: { id: listId, userId },
    });

    if (!existingList) {
      throw new ForbiddenException('List not found or you are not the owner');
    }

    const deletedList = await this.prisma.list.delete({
      where: { id: listId, userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (existingList.listPhoto) {
      const photoKey = this.s3Service.extractKeyFromUrl(existingList.listPhoto);
      if (photoKey) {
        this.scheduleCleanup([photoKey], 'list_deleted').catch((err) =>
          this.logger.warn(
            `Failed to cleanup image for deleted list ${listId}`,
            err,
          ),
        );
      }
    }

    return {
      message: `List "${deletedList.name}" deleted successfully`,
      id: deletedList.id,
    };
  }

  async addPostToList(userId: string, listId: string, postId: string) {
    const list = await this.prisma.list.findUnique({
      where: { id: listId, userId },
      select: { id: true },
    });

    if (!list) {
      throw new ForbiddenException('List not found or you are not the owner');
    }

    const post = await this.prisma.post.findUnique({
      where: { id: postId, isDeleted: false },
      select: { id: true },
    });

    if (!post) {
      throw new BadRequestException('Post not found');
    }

    const result = await this.prisma.listItem.createMany({
      data: {
        listId,
        postId,
      },
      skipDuplicates: true,
    });

    return {
      message:
        result.count > 0
          ? 'Post added to list successfully'
          : 'Post is already in this list',
      addedCount: result.count,
    };
  }

  async removePostFromList(userId: string, listId: string, postId: string) {
    const list = await this.prisma.list.findUnique({
      where: { id: listId, userId },
      select: { id: true },
    });

    if (!list) {
      throw new ForbiddenException('List not found or you are not the owner');
    }

    const result = await this.prisma.listItem.deleteMany({
      where: {
        listId,
        postId,
      },
    });

    if (result.count === 0) {
      throw new BadRequestException('Post is not in this list');
    }

    return {
      message: 'Post removed from list successfully',
    };
  }

  private async scheduleCleanup(
    keys: string[],
    reason: CleanupJobData['reason'],
  ) {
    await this.cleanupQueue.add(
      JOB_NAMES.CLEANUP_FAILED_UPLOAD,
      { keys, reason },
      {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        delay: 1000,
      },
    );
  }
}
