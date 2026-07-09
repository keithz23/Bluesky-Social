import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UploadModule } from 'src/uploads/upload.module';
import { S3Service } from 'src/uploads/s3.service';
import { SocketModule } from '../socket/socket.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { QUEUE_NAMES } from 'src/common/constants/queue.constant';

@Module({
  imports: [
    PrismaModule,
    UploadModule,
    SocketModule,
    NotificationsModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.FEED_FANOUT,
    }),
  ],
  controllers: [PostsController],
  providers: [PostsService, S3Service],
})
export class PostsModule {}
