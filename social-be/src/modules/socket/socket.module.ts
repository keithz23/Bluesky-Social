import { Global, Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { JwtModule } from '@nestjs/jwt';
import { NotificationGateway } from './notification.gateway';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Global()
@Module({
  imports: [JwtModule, EventEmitterModule],
  providers: [SocketGateway, NotificationGateway],
  exports: [SocketGateway, NotificationGateway],
})
export class SocketModule {}
