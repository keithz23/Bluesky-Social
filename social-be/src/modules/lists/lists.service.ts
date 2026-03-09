import { Injectable, Logger } from '@nestjs/common';
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
    listPhotos?: Express.Multer.File[],
  ) {
    const { name, description } = createListDto;
    let uploadResults: UploadResult[] = [];
    const uploadedKeys: string[] = [];
    let photoUrl: string | undefined = undefined;

    if (listPhotos && listPhotos.length > 0) {
      try {
        uploadResults = await this.s3Service.uploadImages(
          listPhotos,
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

  async getLists(userId: string, cursorId?: string, limit: number = 20) {
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
      },
    });

    const hasMore = lists.length > limit;

    if (hasMore) lists.pop();

    const nextCursor = hasMore ? lists[lists.length - 1].id : null;

    return {
      lists,
      nextCursor,
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
