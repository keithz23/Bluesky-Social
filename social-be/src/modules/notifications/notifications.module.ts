import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { SocketModule } from '../socket/socket.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RateLimitModule } from 'src/rate-limit/rate-limit.module';

@Module({
  imports: [SocketModule, PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
