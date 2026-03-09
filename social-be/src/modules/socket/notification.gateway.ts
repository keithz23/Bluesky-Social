import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private logger = new Logger(NotificationGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) throw new Error("Can't find token in auth handshake");

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('config.jwt.secret'),
      });

      client.data.userId = payload.sub;

      client.join(`user:${payload.sub}`);

      this.logger.log(
        `User ${payload.sub} connected (Socket ID: ${client.id})`,
      );
    } catch (error) {
      this.logger.error(`Connect error: ${error.message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`User ${client.data.userId} disconnected`);
  }

  @SubscribeMessage('get-notifications')
  handleGetNotifications(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;

    if (!userId) {
      client.emit('notifications:error', { message: 'User not authenticated' });
      return;
    }

    this.eventEmitter.emit('notifications.get', {
      userId,
      socketId: client.id,
    });
  }

  @SubscribeMessage('mark-notification-read')
  handleMarkRead(
    @MessageBody() data: { notificationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;

    if (!userId) return;

    this.eventEmitter.emit('notifications.markRead', {
      userId,
      notificationId: data.notificationId,
      socketId: client.id,
    });
  }

  @SubscribeMessage('mark-all-read')
  handleMarkAllRead(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;

    if (!userId) return;

    this.eventEmitter.emit('notifications.markAllRead', {
      userId,
      socketId: client.id,
    });
  }

  emitToUserById(userId: string, event: string, payload: any) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  async isUserConnected(userId: string): Promise<boolean> {
    const sockets = await this.server.in(`user:${userId}`).fetchSockets();
    return sockets.length > 0;
  }
}
