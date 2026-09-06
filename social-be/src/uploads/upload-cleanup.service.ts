import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  CleanupJobData,
  JOB_NAMES,
  QUEUE_NAMES,
} from 'src/common/constants/queue.constant';

@Injectable()
export class UploadCleanupService {
  constructor(
    @InjectQueue(QUEUE_NAMES.CLEANUP)
    private readonly cleanupQueue: Queue<CleanupJobData>,
  ) {}

  async schedule(
    keys: string[],
    reason: CleanupJobData['reason'],
  ): Promise<void> {
    if (!keys.length) return;

    await this.cleanupQueue.add(
      JOB_NAMES.CLEANUP_FAILED_UPLOAD,
      { keys, reason },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
        delay: 1000,
      },
    );
  }
}
