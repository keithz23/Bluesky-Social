import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
  namespace: '/socket',
})
export class CommentGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private logger = new Logger(CommentGateway.name);
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // 1. get token from auth
      const token = client.handshake.auth?.token;

      if (!token) {
        throw new Error('Không tìm thấy token trong handshake.auth');
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

  sendNotification(userId: string, notification: any) {
    this.logger.debug(notification);
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  isUserOnline(userId: string) {
    return this.userSockets.has(userId);
  }
}
