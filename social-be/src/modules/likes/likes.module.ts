import { Module } from '@nestjs/common';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SocketModule } from '../socket/socket.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, SocketModule, NotificationsModule],
  controllers: [LikesController],
  providers: [LikesService],
})
export class LikesModule {}
