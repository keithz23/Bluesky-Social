import { Injectable, Logger } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { S3Service } from 'src/uploads/s3.service';
import { UploadResult } from 'src/common/interfaces/file-upload.interface';
import { MediaType, ReplyPolicy } from '@prisma/client';
import {
  CleanupJobData,
  JOB_NAMES,
  QUEUE_NAMES,
} from 'src/common/constants/queue.constant';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class PostsService {
  private logger = new Logger(PostsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    @InjectQueue(QUEUE_NAMES.CLEANUP)
    private cleanupQueue: Queue<CleanupJobData>,
    @InjectQueue(QUEUE_NAMES.IMAGE_PROCESSING)
    private imageProcessingQueue: Queue,
  ) {}

  async create(
    userId: string,
    createPostDto: CreatePostDto,
    images?: Express.Multer.File[],
  ) {
    const { content, replyPrivacy, gifUrl } = createPostDto;
    let uploadResults: UploadResult[] = [];
    const uploadedKeys: string[] = [];

    if (images && images.length > 0) {
      try {
        uploadResults = await this.s3Service.uploadImages(
          images,
          `public/posts/${userId}/images`,
          { resize: true, quality: 85 },
        );
        uploadedKeys.push(...uploadResults.map((r) => r.key));
      } catch (error) {
        this.logger.error('Error uploading images', error);
        throw new Error('Failed to upload images');
      }
    }

    // Download GIF from URL,  upload to S3
    let gifUploadResult: UploadResult | null = null;
    if (!images?.length && gifUrl) {
      try {
        const response = await fetch(gifUrl);
        if (!response.ok) {
          throw new Error(`Failed to download GIF: ${response.statusText}`);
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        gifUploadResult = await this.s3Service.uploadBuffer(
          buffer,
          `public/posts/${userId}/gifs`,
          'gif',
          'image/gif',
        );
        uploadedKeys.push(gifUploadResult.key);
      } catch (error) {
        this.logger.error('Error uploading GIF to S3', error);
        throw new Error('Failed to upload GIF');
      }
    }

    try {
      const fullPost = await this.prisma.$transaction(async (tx) => {
        // Create post
        const created = await tx.post.create({
          data: {
            content: content ?? '',
            replyPolicy: replyPrivacy?.type
              ? (replyPrivacy.type.toUpperCase() as ReplyPolicy)
              : 'ANYONE',
            userId,
          },
        });

        // increment postsCount
        await tx.user.update({
          where: { id: userId },
          data: { postsCount: { increment: 1 } },
        });

        // Create media records
        if (uploadResults.length > 0) {
          await tx.postMedia.createMany({
            data: uploadResults.map((u, idx) => ({
              postId: created.id,
              mediaUrl: u.url,
              mediaType: MediaType.IMAGE,
              fileSize: u.size,
              orderIndex: idx,
            })),
          });
        }

        if (gifUploadResult) {
          await tx.postMedia.create({
            data: {
              postId: created.id,
              mediaUrl: gifUploadResult.url,
              mediaType: MediaType.GIF,
              fileSize: gifUploadResult.size,
              orderIndex: 0,
            },
          });
        }

        return tx.post.findUnique({
          where: { id: created.id },
          include: {
            media: { orderBy: { orderIndex: 'asc' } },
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: {
                likes: true,
                replies: true,
                reposts: true,
                bookmarks: true,
              },
            },
          },
        });
      });

      return fullPost;
    } catch (error) {
      // Cleanup S3 if transaction fail
      if (uploadedKeys.length > 0) {
        await this.scheduleCleanup(uploadedKeys, 'transaction_failed');
        this.logger.warn(
          `Scheduled cleanup for ${uploadedKeys.length} orphaned files`,
        );
      }
      throw error;
    }
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

  findAll() {
    return `This action returns all posts`;
  }

  findOne(id: number) {
    return `This action returns a #${id} post`;
  }

  update(id: number, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
