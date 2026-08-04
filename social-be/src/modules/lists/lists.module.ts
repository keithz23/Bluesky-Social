import { Module } from '@nestjs/common';
import { ListsService } from './lists.service';
import { ListsController } from './lists.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UploadModule } from 'src/uploads/upload.module';
import { SocketModule } from '../socket/socket.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BullModule } from '@nestjs/bullmq';
import { VisibilityModule } from 'src/common/services/visibility.module';

@Module({
  imports: [
    PrismaModule,
    UploadModule,
    SocketModule,
    NotificationsModule,
    VisibilityModule,
    BullModule.registerQueue({
      name: 'posts',
    }),
  ],
  controllers: [ListsController],
  providers: [ListsService],
})
export class ListsModule {}
