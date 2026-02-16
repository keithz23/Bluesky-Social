import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { S3Service } from '../s3.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  JOB_NAMES,
  QUEUE_NAMES,
  UploadImagesJobData,
} from 'src/common/constants/queue.constant';
import { $Enums } from '@prisma/client';

@Processor(QUEUE_NAMES.IMAGE_PROCESSING, {
  concurrency: 5, // Process 5 jobs simultaneously
})
export class ImageProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger(ImageProcessingProcessor.name);

  constructor(
    private readonly s3Service: S3Service,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<UploadImagesJobData>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);

    switch (job.name) {
      case JOB_NAMES.UPLOAD_IMAGES:
        return this.handleUploadImages(job);
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  }

  private async handleUploadImages(job: Job<UploadImagesJobData>) {
    const { files, folder, postId, userId, options } = job.data;

    try {
      // Update progress
      await job.updateProgress(10);

      // Convert buffers back to files
      const { Readable } = require('stream');
      const multerFiles: Express.Multer.File[] = files.map((f) => ({
        buffer: Buffer.from(f.buffer),
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
        fieldname: 'images',
        encoding: '7bit',
        destination: '',
        filename: '',
        path: '',
        stream: Readable.from(Buffer.from(f.buffer)),
      }));

      await job.updateProgress(20);

      // Upload to S3
      const uploadResults = await this.s3Service.uploadImages(
        multerFiles,
        folder,
        options,
      );

      await job.updateProgress(60);

      // Save to database if postId exists
      if (postId) {
        const mediaData = uploadResults.map((u, idx) => ({
          postId,
          mediaUrl: u.url,
          mediaType: $Enums.MediaType.IMAGE,
          width: null,
          height: null,
          duration: null,
          fileSize: u.size,
          orderIndex: idx,
        }));

        await this.prisma.postMedia.createMany({
          data: mediaData,
        });

        this.logger.log(
          `Saved ${mediaData.length} media records for post ${postId}`,
        );
      }

      await job.updateProgress(100);

      return {
        success: true,
        uploadResults,
        postId,
      };
    } catch (error) {
      this.logger.error(`Failed to process job ${job.id}:`, error);
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Job ${job.id} failed after ${job.attemptsMade} attempts:`,
      error,
    );

    // Schedule cleanup if all retries exhausted
    const maxAttempts = job.opts.attempts ?? 1;
    if (job.attemptsMade >= maxAttempts) {
      this.scheduleCleanup(job);
    }
  }

  private async scheduleCleanup(job: Job<UploadImagesJobData>) {
    // TODO: Add cleanup job to queue
    this.logger.warn(`Scheduling cleanup for failed job ${job.id}`);
  }
}
