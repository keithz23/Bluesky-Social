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
import { KeywordsModule } from '../admin/keywords/keywords.module';
import { SettingsModule } from '../admin/settings/settings.module';
import { ImageModerationService } from './services/image-moderation.service';
import { PostFormatterService } from './services/post-formatter.service';
import { PostHashtagService } from './services/post-hashtag.service';
import { PostMediaService } from './services/post-media.service';
import { PostModerationService } from './services/post-moderation.service';
import { VisibilityModule } from 'src/common/services/visibility.module';

@Module({
  imports: [
    PrismaModule,
    UploadModule,
    SocketModule,
    NotificationsModule,
    KeywordsModule,
    SettingsModule,
    VisibilityModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.FEED_FANOUT,
    }),
  ],
  controllers: [PostsController],
  providers: [
    PostsService,
    S3Service,
    ImageModerationService,
    PostFormatterService,
    PostHashtagService,
    PostMediaService,
    PostModerationService,
  ],
})
export class PostsModule {}
