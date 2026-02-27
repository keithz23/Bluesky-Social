import { Global, Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { JwtModule } from '@nestjs/jwt';
import { NotificationGateway } from './notification.gateway';
import { CommentGateway } from './comment.gateway';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Global()
@Module({
  imports: [JwtModule, EventEmitterModule],
  providers: [SocketGateway, NotificationGateway, CommentGateway],
  exports: [SocketGateway, NotificationGateway, CommentGateway],
})
export class SocketModule {}
