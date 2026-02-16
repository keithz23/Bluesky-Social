import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { S3Service } from '../s3.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CleanupJobData,
  JOB_NAMES,
  QUEUE_NAMES,
} from 'src/common/constants/queue.constant';

@Processor(QUEUE_NAMES.CLEANUP, {
  concurrency: 3,
})
export class CleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(CleanupProcessor.name);

  constructor(
    private readonly s3Service: S3Service,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<CleanupJobData>): Promise<any> {
    this.logger.log(`Processing cleanup job ${job.id}`);

    switch (job.name) {
      case JOB_NAMES.CLEANUP_FAILED_UPLOAD:
        return this.handleCleanupFailedUpload(job);
      case JOB_NAMES.CLEANUP_ORPHANED_FILES:
        return this.handleCleanupOrphanedFiles(job);
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  }

  private async handleCleanupFailedUpload(job: Job<CleanupJobData>) {
    const { keys, reason } = job.data;

    try {
      await job.updateProgress(20);

      // Delete from S3
      await this.s3Service.deleteFiles(keys);

      await job.updateProgress(80);

      // Log cleanup
      // await this.prisma.cleanupLog.create({
      //   data: {
      //     keys: keys,
      //     reason,
      //     status: 'success',
      //     deletedAt: new Date(),
      //   },
      // });

      await job.updateProgress(100);

      this.logger.log(`Successfully cleaned up ${keys.length} files`);

      return {
        success: true,
        deletedCount: keys.length,
      };
    } catch (error) {
      this.logger.error(`Cleanup failed for keys: ${keys.join(', ')}`, error);

      // Log failed cleanup
      // await this.prisma.cleanupLog.create({
      //   data: {
      //     keys: keys,
      //     reason,
      //     status: 'failed',
      //     error: error.message,
      //     deletedAt: new Date(),
      //   },
      // });

      throw error;
    }
  }

  private async handleCleanupOrphanedFiles(job: Job<CleanupJobData>) {
    const { keys } = job.data;

    this.logger.log(`Cleaning up ${keys.length} orphaned files`);

    // Similar to cleanup failed upload
    return this.handleCleanupFailedUpload(job);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Cleanup job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Cleanup job ${job.id} failed after ${job.attemptsMade} attempts:`,
      error,
    );

    // If all retries fail, we need manual intervention
    if (job.attemptsMade >= (job.opts.attempts ?? 0)) {
      this.logger.error(
        `MANUAL CLEANUP REQUIRED for keys: ${job.data.keys.join(', ')}`,
      );
      // TODO: Send alert to monitoring system
    }
  }
}
