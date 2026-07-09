import { Module } from '@nestjs/common';
import { FollowsService } from './follows.service';
import { FollowsController } from './follows.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from 'src/common/constants/queue.constant';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.FEED_FANOUT,
    }),
  ],
  controllers: [FollowsController],
  providers: [FollowsService],
})
export class FollowsModule {}
