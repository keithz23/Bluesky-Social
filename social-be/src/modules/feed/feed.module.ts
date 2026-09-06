import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from 'src/common/constants/queue.constant';
import { FeedFanoutProcessor } from './processors/feed-fanout.processor';
import { VisibilityModule } from 'src/common/services/visibility.module';
import { FeedPostPresenterService } from './services/feed-post-presenter.service';
import { FeedRankingService } from './services/feed-ranking.service';

@Module({
  imports: [
    PrismaModule,
    VisibilityModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.FEED_FANOUT,
    }),
  ],
  controllers: [FeedController],
  providers: [FeedService, FeedFanoutProcessor, FeedPostPresenterService, FeedRankingService],
})
export class FeedModule {}
