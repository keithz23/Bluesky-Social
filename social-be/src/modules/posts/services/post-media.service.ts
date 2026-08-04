import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  CleanupJobData,
  JOB_NAMES,
  QUEUE_NAMES,
} from 'src/common/constants/queue.constant';
import { UploadResult } from 'src/common/interfaces/file-upload.interface';
import { S3Service } from 'src/uploads/s3.service';

@Injectable()
export class PostMediaService {
  private readonly logger = new Logger(PostMediaService.name);

  constructor(
    private readonly s3Service: S3Service,
    @InjectQueue(QUEUE_NAMES.CLEANUP)
    private readonly cleanupQueue: Queue<CleanupJobData>,
  ) {}

  async uploadImages(userId: string, images?: Express.Multer.File[]) {
    if (!images?.length) {
      return { uploadResults: [] as UploadResult[], uploadedKeys: [] };
    }

    try {
      const uploadResults = await this.s3Service.uploadImages(
        images,
        `public/posts/${userId}/images`,
        { resize: true, quality: 85 },
      );

      return {
        uploadResults,
        uploadedKeys: uploadResults.map((result) => result.key),
      };
    } catch (error) {
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
      return { gifUploadResult: null as UploadResult | null, uploadedKeys: [] };
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

      return {
        gifUploadResult,
        uploadedKeys: [gifUploadResult.key],
      };
    } catch (error) {
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
}
