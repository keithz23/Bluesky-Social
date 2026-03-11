import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { CreateListDto } from './dto/create-list.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { S3Service } from 'src/uploads/s3.service';
import { SocketGateway } from '../socket/socket.gateway';
import { InjectQueue } from '@nestjs/bullmq';
import {
  CleanupJobData,
  JOB_NAMES,
  QUEUE_NAMES,
} from 'src/common/constants/queue.constant';
import { Queue } from 'bullmq';
import { UploadResult } from 'src/common/interfaces/file-upload.interface';
import { FeedQueryDto } from '../feed/dto/feed-query.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { boolean } from 'joi';

@Injectable()
export class ListsService {
  private logger = new Logger(ListsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly notificationService: NotificationsService,
    private readonly socketGateway: SocketGateway,
    @InjectQueue(QUEUE_NAMES.CLEANUP)
    private cleanupQueue: Queue<CleanupJobData>,
    @InjectQueue(QUEUE_NAMES.IMAGE_PROCESSING)
    private imageProcessingQueue: Queue,
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

        uploadedKeys.push(...uploadResults.map((r) => r.key));

        photoUrl = uploadResults[0]?.url;
      } catch (error) {
        this.logger.error('Error uploading images', error);
        throw new Error('Failed to upload image');
      }
    }

    try {
      const createdList = await this.prisma.$transaction(async (tx) => {
        return await tx.list.create({
          data: {
            name,
            description,
            userId,
            ...(photoUrl && { listPhoto: photoUrl }),
          },
        });
      });

      return createdList;
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

  async getLists(userId: string, query: FeedQueryDto) {
    const limit = query.limit ?? 20;
    const cursorId = query.cursor;
    const lists = await this.prisma.list.findMany({
      where: {
        userId,
      },
      take: limit + 1,

      ...(cursorId && {
        cursor: { id: cursorId },
        skip: 1,
      }),

      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        name: true,
        description: true,
        listPhoto: true,
        createdAt: true,
        userId: true,
        members: {
          select: {
            id: true,
            listId: true,
            memberId: true,
            addedBy: true,
            addedAt: true,
            user: {
              select: {
                id: true,
                bio: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                coverUrl: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            bio: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            coverUrl: true,
          },
        },
      },
    });

    const hasMore = lists.length > limit;

    if (hasMore) lists.pop();

    const nextCursor = hasMore ? lists[lists.length - 1].id : null;

    return {
      lists,
      hasMore,
      nextCursor,
    };
  }

  async getListById(userId: string, listId: string) {
    const list = await this.prisma.list.findUnique({
      where: {
        id: listId,
        userId,
      },

      select: {
        id: true,
        name: true,
        description: true,
        listPhoto: true,
        createdAt: true,
        userId: true,

        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },

        items: {
          orderBy: { addedAt: 'desc' },
          take: 20,
          select: {
            id: true,
            post: {
              select: {
                id: true,
                content: true,
                createdAt: true,
                likeCount: true,
                replyCount: true,
                repostCount: true,
                bookmarkCount: true,
                user: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                    verified: true,
                  },
                },
                media: {
                  orderBy: { orderIndex: 'asc' },
                  select: {
                    id: true,
                    mediaUrl: true,
                    mediaType: true,
                    width: true,
                    height: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!list) return null;

    const mappedPosts = list.items.map((item) => item.post);

    const { items, ...listData } = list;

    return {
      ...listData,
      posts: mappedPosts,
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
        delay: 1000, // Delay 1s before cleanup
      },
    );
  }

  private extractKeyFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1);
    } catch {
      return url;
    }
  }
}
