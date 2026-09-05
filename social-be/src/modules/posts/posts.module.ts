import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UploadModule } from 'src/uploads/upload.module';
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
import { PostCommandService } from './services/post-command.service';
import { PostNotificationService } from './services/post-notification.service';
import { PostPinService } from './services/post-pin.service';
import { PostQueryService } from './services/post-query.service';
import { PostReplyService } from './services/post-reply.service';

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
    PostCommandService,
    PostQueryService,
    PostReplyService,
    PostPinService,
    PostNotificationService,
    ImageModerationService,
    PostFormatterService,
    PostHashtagService,
    PostMediaService,
    PostModerationService,
  ],
})
export class PostsModule {}
