import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from 'src/common/constants/queue.constant';
import { PrismaModule } from 'src/prisma/prisma.module';
import { DevPostBotsService } from './dev-post-bots.service';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.FEED_FANOUT,
    }),
  ],
  providers: [DevPostBotsService],
})
export class DevDataModule {}
