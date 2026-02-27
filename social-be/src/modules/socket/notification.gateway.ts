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

  private userSockets = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,
    private configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // 1. get token from auth
      const token = client.handshake.auth?.token;

      if (!token) {
        throw new Error("Can't find token in auth handshake");
      }

      // 2. Verify token
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('config.jwt.secret'),
      });

      client.data.userId = payload.sub;

      client.join(`user:${payload.sub}`);

      this.userSockets.set(payload.sub, client.id);

      this.logger.log(`User ${payload.sub} connected`);
    } catch (error) {
      this.logger.error(`Connect error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.userSockets.delete(userId);
    }
  }

  @SubscribeMessage('get-notifications')
  handleGetNotifications(@ConnectedSocket() client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (!userId) {
      client.emit('notifications:error', { message: 'User not authenticated' });
      return;
    }

    this.eventEmitter.emit('notifications.get', {
      userId,
      socketId: client.id,
    });
    this.logger.debug(
      this.eventEmitter.emit('notifications.get', {
        userId,
        socketId: client.id,
      }),
    );
  }

  @SubscribeMessage('mark-notification-read')
  handleMarkRead(
    @MessageBody() data: { notificationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.query.userId as string;
    if (!userId) {
      client.emit('notifications:error', { message: 'User not authenticated' });
      return;
    }
    this.eventEmitter.emit('notifications.markRead', {
      userId,
      notificationId: data.notificationId,
      socketId: client.id,
    });
  }

  @SubscribeMessage('mark-all-read')
  handleMarkAllRead(@ConnectedSocket() client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (!userId) {
      client.emit('notifications:error', { message: 'User not authenticated' });
      return;
    }
    this.eventEmitter.emit('notifications.markAllRead', {
      userId,
      socketId: client.id,
    });
  }

  isUserOnline(userId: string) {
    return this.userSockets.has(userId);
  }

  emitToUserById(userId: string, event: string, payload: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, payload);
    }
  }

  isUserConnected(userId: string) {
    return this.userSockets.has(userId);
  }

  getSocketId(userId: string) {
    return this.userSockets.get(userId);
  }
}
