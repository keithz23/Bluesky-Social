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
import { Logger, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { PrismaService } from 'src/prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly chatService: ChatService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Connection handling ──────────────────────────────────

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '') || // for Headers (Postman)
        client.handshake.query?.token; // For params (postman)
      if (!token) throw new Error('Missing auth token');

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('config.jwt.secret'),
      });

      const userId = payload.sub;
      client.data.userId = userId;

      // Fetch username for typing indicators
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      });
      client.data.username = user?.username ?? userId;

      // Join personal room
      client.join(`user:${userId}`);

      // Auto-join all conversation rooms
      const conversationIds =
        await this.chatService.getUserConversationIds(userId);
      for (const cId of conversationIds) {
        client.join(`conversation:${cId}`);
      }

      this.logger.log(`User ${userId} connected to chat (${client.id})`);
    } catch (error) {
      this.logger.error(`Chat connect error: ${error.message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`User ${client.data.userId} disconnected from chat`);
  }

  // ─── Room management ──────────────────────────────────────

  @SubscribeMessage('join-conversation')
  handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`conversation:${data.conversationId}`);
    this.logger.log(
      `User ${client.data.userId} joined conversation:${data.conversationId}`,
    );
  }

  @SubscribeMessage('leave-conversation')
  handleLeaveConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`conversation:${data.conversationId}`);
    this.logger.log(
      `User ${client.data.userId} left conversation:${data.conversationId}`,
    );
  }

  // ─── Messaging ────────────────────────────────────────────

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @MessageBody()
    data: {
      conversationId: string;
      content: string;
      type?: string;
      replyToId?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    try {
      const message = await this.chatService.createMessage(userId, {
        conversationId: data.conversationId,
        content: data.content,
        type: data.type,
        replyToId: data.replyToId,
      });

      // Broadcast to everyone in the conversation room
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('new-message', {
          message,
          conversationId: data.conversationId,
        });

      // Notify participants not currently in the conversation room
      // (sidebar update for unread badges)
      const participantIds = await this.chatService.getParticipantIds(
        data.conversationId,
      );
      for (const pId of participantIds) {
        if (pId !== userId) {
          this.server.to(`user:${pId}`).emit('conversation-updated', {
            conversationId: data.conversationId,
            lastMessage: message,
          });
        }
      }
    } catch (error) {
      this.logger.error(`send-message error: ${error.message}`);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  // ─── Typing indicators ───────────────────────────────────

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    // Get username for display
    client.to(`conversation:${data.conversationId}`).emit('user-typing', {
      userId,
      username: client.data.username ?? userId,
      conversationId: data.conversationId,
    });
  }

  @SubscribeMessage('stop-typing')
  handleStopTyping(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    client.to(`conversation:${data.conversationId}`).emit('user-stop-typing', {
      userId,
      conversationId: data.conversationId,
    });
  }

  // ─── Read receipts ───────────────────────────────────────

  @SubscribeMessage('mark-read')
  async handleMarkRead(
    @MessageBody() data: { conversationId: string; messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    try {
      const result = await this.chatService.markRead(
        userId,
        data.conversationId,
        data.messageId,
      );

      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('message-read', result);
    } catch (error) {
      this.logger.error(`mark-read error: ${error.message}`);
    }
  }

  // ─── Edit & Delete ───────────────────────────────────────

  @SubscribeMessage('edit-message')
  async handleEditMessage(
    @MessageBody() data: { messageId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    try {
      const updated = await this.chatService.editMessage(
        userId,
        data.messageId,
        data.content,
      );

      this.server
        .to(`conversation:${updated.conversationId}`)
        .emit('message-edited', {
          messageId: updated.id,
          content: updated.content,
          editedAt: updated.editedAt,
        });
    } catch (error) {
      this.logger.error(`edit-message error: ${error.message}`);
      client.emit('error', { message: 'Failed to edit message' });
    }
  }

  @SubscribeMessage('delete-message')
  async handleDeleteMessage(
    @MessageBody() data: { messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    try {
      const result = await this.chatService.deleteMessage(
        userId,
        data.messageId,
      );

      this.server
        .to(`conversation:${result.conversationId}`)
        .emit('message-deleted', {
          messageId: result.id,
          conversationId: result.conversationId,
        });
    } catch (error) {
      this.logger.error(`delete-message error: ${error.message}`);
      client.emit('error', { message: 'Failed to delete message' });
    }
  }

  @SubscribeMessage('delete-message-for-me')
  async handleDeleteForMe(
    @MessageBody() data: { messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    try {
      const result = await this.chatService.deleteMessageForMe(
        userId,
        data.messageId,
      );
      client.emit('message-deleted-for-me', result);
    } catch (error) {
      this.logger.error(`delete-message-for-me error: ${error.message}`);
    }
  }

  // ─── Reactions ────────────────────────────────────────────

  @SubscribeMessage('react-message')
  async handleReactMessage(
    @MessageBody() data: { messageId: string; emoji: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    try {
      const result = await this.chatService.toggleReaction(
        userId,
        data.messageId,
        data.emoji,
      );

      // Need the conversation ID to broadcast
      const message = await this.chatService['prisma'].message.findUnique({
        where: { id: data.messageId },
        select: { conversationId: true },
      });

      if (message) {
        this.server
          .to(`conversation:${message.conversationId}`)
          .emit('message-reaction-updated', result);
      }
    } catch (error) {
      this.logger.error(`react-message error: ${error.message}`);
    }
  }

  // ─── Helper: notify new conversation ──────────────────────

  emitNewConversation(userId: string, conversation: any) {
    this.server.to(`user:${userId}`).emit('new-conversation', conversation);
  }
}
