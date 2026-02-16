// src/uploads/uploads.module.ts
import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { S3Service } from './s3.service';
import { QUEUE_NAMES } from 'src/common/constants/queue.constant';
import { ImageProcessingProcessor } from './processors/image-processing.processor';
import { CleanupProcessor } from './processors/cleanup.processor';

@Global()
@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: QUEUE_NAMES.IMAGE_PROCESSING,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: false,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      },
      {
        name: QUEUE_NAMES.CLEANUP,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: false,
          attempts: 5,
          backoff: { type: 'exponential', delay: 5000 },
        },
      },
    ),
  ],
  providers: [S3Service, ImageProcessingProcessor, CleanupProcessor],
  exports: [S3Service, BullModule],
})
export class UploadModule {}
