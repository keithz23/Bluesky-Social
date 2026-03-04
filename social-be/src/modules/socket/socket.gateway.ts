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
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
  namespace: '/socket',
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private logger = new Logger(SocketGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    //I treat Socket.io as a transport layer.
    // For stable identification,
    // I map the userId from the database to the socket.id.
    // By using Rooms, I can bridge the gap between a persistent User identity and their temporary physical connections.
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

  // ── Post Room Management ──────────────────────────────────

  @SubscribeMessage('join-post')
  handleJoinPost(
    @MessageBody() data: { postId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`post:${data.postId}`);
    this.logger.log(
      `User ${client.data.userId} joined room post:${data.postId}`,
    );
  }

  @SubscribeMessage('leave-post')
  handleLeavePost(
    @MessageBody() data: { postId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`post:${data.postId}`);
    this.logger.log(
      `User ${client.data.userId} left room post:${data.postId}`,
    );
  }

  // ── Broadcast helpers ─────────────────────────────────────

  /** Emit an event to every user currently viewing a specific post */
  emitToPost(postId: string, event: string, payload: any) {
    this.server.to(`post:${postId}`).emit(event, payload);
  }

  /** Emit an event to a specific user by their DB id */
  emitToUser(userId: string, event: string, payload: any) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  // ── Generic DB change broadcast ───────────────────────────

  @OnEvent('database.changed')
  handleDatabaseChange(payload: { model: string; action: string; data: any }) {
    const { model, action, data } = payload;
    const eventName = `${model}_${action}`;
    this.logger.log(`event name::: ${eventName}`);
    this.server.emit(eventName, data);
  }
}
