import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from 'src/common/constants/queue.constant';
import { FeedFanoutProcessor } from './processors/feed-fanout.processor';
import { VisibilityModule } from 'src/common/services/visibility.module';

@Module({
  imports: [
    PrismaModule,
    VisibilityModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.FEED_FANOUT,
    }),
  ],
  controllers: [FeedController],
  providers: [FeedService, FeedFanoutProcessor],
})
export class FeedModule {}
