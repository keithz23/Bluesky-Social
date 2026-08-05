import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  CleanupJobData,
  JOB_NAMES,
  QUEUE_NAMES,
} from 'src/common/constants/queue.constant';
import { UploadResult } from 'src/common/interfaces/file-upload.interface';
import { S3Service } from 'src/uploads/s3.service';
import {
  ImageModerationResult,
  ImageModerationService,
} from './image-moderation.service';

export type ModeratedUploadResult = UploadResult & {
  moderation: ImageModerationResult;
};

@Injectable()
export class PostMediaService {
  private readonly logger = new Logger(PostMediaService.name);

  constructor(
    private readonly s3Service: S3Service,
    private readonly imageModeration: ImageModerationService,
    @InjectQueue(QUEUE_NAMES.CLEANUP)
    private readonly cleanupQueue: Queue<CleanupJobData>,
  ) {}

  async uploadImages(userId: string, images?: Express.Multer.File[]) {
    if (!images?.length) {
      return { uploadResults: [] as ModeratedUploadResult[], uploadedKeys: [] };
    }

    try {
      const uploadResults = await this.s3Service.uploadImages(
        images,
        `public/posts/${userId}/images`,
        { resize: true, quality: 85 },
      );
      const moderatedResults = await this.moderateUploads(uploadResults);
      await this.rejectBlockedUploads(moderatedResults);

      return {
        uploadResults: moderatedResults,
        uploadedKeys: moderatedResults.map((result) => result.key),
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Error uploading images', error);
      throw new Error('Failed to upload images');
    }
  }

  async uploadGif(
    userId: string,
    gifUrl: string | undefined,
    enabled: boolean,
  ) {
    if (!enabled || !gifUrl) {
      return {
        gifUploadResult: null as ModeratedUploadResult | null,
        uploadedKeys: [],
      };
    }

    try {
      const response = await fetch(gifUrl);
      if (!response.ok) {
        throw new Error(`Failed to download GIF: ${response.statusText}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      const gifUploadResult = await this.s3Service.uploadBuffer(
        buffer,
        `public/posts/${userId}/gifs`,
        'gif',
        'image/gif',
      );
      const [moderatedGifUploadResult] = await this.moderateUploads([
        gifUploadResult,
      ]);
      await this.rejectBlockedUploads([moderatedGifUploadResult]);

      return {
        gifUploadResult: moderatedGifUploadResult,
        uploadedKeys: [moderatedGifUploadResult.key],
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Error uploading GIF to S3', error);
      throw new Error('Failed to upload GIF');
    }
  }

  async scheduleCleanup(keys: string[], reason: CleanupJobData['reason']) {
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

  extractKeyFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1);
    } catch {
      return url;
    }
  }

  private async moderateUploads(uploadResults: UploadResult[]) {
    const moderationResults = await Promise.all(
      uploadResults.map((upload) => this.imageModeration.scanUpload(upload)),
    );

    return uploadResults.map((upload, index) => ({
      ...upload,
      moderation: moderationResults[index],
    }));
  }

  private async rejectBlockedUploads(uploadResults: ModeratedUploadResult[]) {
    const blocked = uploadResults.filter(
      (upload) => upload.moderation.shouldBlock,
    );
    if (blocked.length === 0) return;

    await this.scheduleCleanup(
      uploadResults.map((upload) => upload.key),
      'moderation_blocked',
    );

    throw new BadRequestException(
      blocked[0].moderation.blockReason ??
        'Image violates content moderation policy',
    );
  }
}
