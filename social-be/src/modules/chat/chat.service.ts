import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { ConversationQueryDto, MessageQueryDto } from './dto/message-query.dto';
import { ConversationType, MessageType } from '@prisma/client';

const USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  verified: true,
};

const MESSAGE_SELECT = {
  id: true,
  conversationId: true,
  senderId: true,
  content: true,
  type: true,
  status: true,
  replyToId: true,
  isDeleted: true,
  isEdited: true,
  editedAt: true,
  createdAt: true,
  sender: { select: USER_SELECT },
  attachments: {
    select: {
      id: true,
      url: true,
      thumbnailUrl: true,
      fileName: true,
      fileSize: true,
      mimeType: true,
      width: true,
      height: true,
    },
  },
  reactions: {
    select: {
      id: true,
      emoji: true,
      userId: true,
      user: { select: USER_SELECT },
    },
  },
  replyTo: {
    select: {
      id: true,
      content: true,
      senderId: true,
      sender: { select: USER_SELECT },
    },
  },
};

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Conversations ────────────────────────────────────────

  async getConversations(userId: string, query: ConversationQueryDto) {
    const limit = query.limit ?? 20;

    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId, leftAt: null },
        },
        ...(query.cursor && { id: { lt: query.cursor } }),
      },
      orderBy: [
        { lastMessageAt: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
      ],
      take: limit + 1,
      select: {
        id: true,
        type: true,
        name: true,
        avatar: true,
        lastMessageAt: true,
        messageCount: true,
        createdAt: true,
        updatedAt: true,
        participants: {
          where: { leftAt: null },
          select: {
            id: true,
            conversationId: true,
            userId: true,
            role: true,
            nickname: true,
            unreadCount: true,
            lastReadMessageId: true,
            isPinned: true,
            isMuted: true,
            user: { select: USER_SELECT },
          },
        },
        lastMessage: {
          select: MESSAGE_SELECT,
        },
      },
    });

    const hasMore = conversations.length > limit;
    if (hasMore) conversations.pop();

    const nextCursor = hasMore
      ? conversations[conversations.length - 1].id
      : null;

    return { conversations, nextCursor };
  }

  async getConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: { userId, leftAt: null },
        },
      },
      select: {
        id: true,
        type: true,
        name: true,
        avatar: true,
        lastMessageAt: true,
        messageCount: true,
        createdAt: true,
        updatedAt: true,
        participants: {
          where: { leftAt: null },
          select: {
            id: true,
            conversationId: true,
            userId: true,
            role: true,
            nickname: true,
            unreadCount: true,
            lastReadMessageId: true,
            isPinned: true,
            isMuted: true,
            user: { select: USER_SELECT },
          },
        },
        lastMessage: {
          select: MESSAGE_SELECT,
        },
      },
    });

    if (!conversation)
      throw new NotFoundException('Conversation not found');

    return conversation;
  }

  async createConversation(userId: string, dto: CreateConversationDto) {
    const { type, participantIds, name } = dto;

    // Validate all participant IDs exist
    const users = await this.prisma.user.findMany({
      where: { id: { in: participantIds } },
      select: { id: true },
    });

    if (users.length !== participantIds.length) {
      throw new BadRequestException('One or more users not found');
    }

    // For DIRECT chats, check if a conversation already exists
    if (type === 'DIRECT') {
      if (participantIds.length !== 1) {
        throw new BadRequestException(
          'Direct conversation requires exactly one other participant',
        );
      }

      const targetUserId = participantIds[0];

      if (targetUserId === userId) {
        throw new BadRequestException('Cannot start a conversation with yourself');
      }

      const existing = await this.prisma.conversation.findFirst({
        where: {
          type: ConversationType.DIRECT,
          AND: [
            { participants: { some: { userId, leftAt: null } } },
            { participants: { some: { userId: targetUserId, leftAt: null } } },
          ],
        },
        select: {
          id: true,
          type: true,
          name: true,
          avatar: true,
          lastMessageAt: true,
          messageCount: true,
          createdAt: true,
          updatedAt: true,
          participants: {
            where: { leftAt: null },
            select: {
              id: true,
              conversationId: true,
              userId: true,
              role: true,
              nickname: true,
              unreadCount: true,
              lastReadMessageId: true,
              isPinned: true,
              isMuted: true,
              user: { select: USER_SELECT },
            },
          },
          lastMessage: {
            select: MESSAGE_SELECT,
          },
        },
      });

      if (existing) return existing;
    }

    // Create new conversation
    const allParticipantIds = [userId, ...participantIds];

    const conversation = await this.prisma.conversation.create({
      data: {
        type: type as ConversationType,
        name: type === 'GROUP' ? name : null,
        participants: {
          create: allParticipantIds.map((id) => ({
            userId: id,
            role: id === userId ? 'OWNER' : 'MEMBER',
          })),
        },
      },
      select: {
        id: true,
        type: true,
        name: true,
        avatar: true,
        lastMessageAt: true,
        messageCount: true,
        createdAt: true,
        updatedAt: true,
        participants: {
          where: { leftAt: null },
          select: {
            id: true,
            conversationId: true,
            userId: true,
            role: true,
            nickname: true,
            unreadCount: true,
            lastReadMessageId: true,
            isPinned: true,
            isMuted: true,
            user: { select: USER_SELECT },
          },
        },
        lastMessage: {
          select: MESSAGE_SELECT,
        },
      },
    });

    return conversation;
  }

  async updateConversation(
    userId: string,
    conversationId: string,
    dto: UpdateConversationDto,
  ) {
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId, leftAt: null },
    });

    if (!participant)
      throw new ForbiddenException('You are not a member of this conversation');

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
      select: {
        id: true,
        type: true,
        name: true,
        avatar: true,
        updatedAt: true,
      },
    });
  }

  async deleteConversation(userId: string, conversationId: string) {
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId, leftAt: null },
    });

    if (!participant)
      throw new ForbiddenException('You are not a member of this conversation');

    // Soft-leave: set leftAt
    await this.prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { leftAt: new Date() },
    });

    return { message: 'Left conversation successfully' };
  }

  // ─── Messages ─────────────────────────────────────────────

  async getMessages(
    userId: string,
    conversationId: string,
    query: MessageQueryDto,
  ) {
    // Verify membership
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId, leftAt: null },
    });

    if (!participant)
      throw new ForbiddenException('You are not a member of this conversation');

    const limit = query.limit ?? 30;

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        isDeleted: false,
        // Exclude messages deleted for this user
        NOT: {
          deletedFor: { some: { userId } },
        },
        ...(query.cursor && { id: { lt: query.cursor } }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      select: MESSAGE_SELECT,
    });

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();

    const nextCursor = hasMore
      ? messages[messages.length - 1].id
      : null;

    return { messages, nextCursor };
  }

  async createMessage(userId: string, dto: SendMessageDto) {
    const { conversationId, content, type, replyToId } = dto;

    // Verify user is a participant
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId, leftAt: null },
    });

    if (!participant)
      throw new ForbiddenException('You are not a member of this conversation');

    const message = await this.prisma.$transaction(async (tx) => {
      // Create the message
      const created = await tx.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: content ?? '',
          type: (type as MessageType) ?? MessageType.TEXT,
          replyToId: replyToId ?? null,
        },
        select: MESSAGE_SELECT,
      });

      // Update conversation's last message
      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageId: created.id,
          lastMessageAt: new Date(),
          messageCount: { increment: 1 },
        },
      });

      // Increment unread count for all participants except sender
      await tx.conversationParticipant.updateMany({
        where: {
          conversationId,
          userId: { not: userId },
          leftAt: null,
        },
        data: {
          unreadCount: { increment: 1 },
        },
      });

      return created;
    });

    return message;
  }

  async editMessage(userId: string, messageId: string, content: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId !== userId)
      throw new ForbiddenException('You can only edit your own messages');

    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
        editedAt: new Date(),
      },
      select: MESSAGE_SELECT,
    });
  }

  async deleteMessage(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId !== userId)
      throw new ForbiddenException('You can only delete your own messages');

    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
      select: { id: true, conversationId: true },
    });
  }

  async deleteMessageForMe(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, conversationId: true },
    });

    if (!message) throw new NotFoundException('Message not found');

    // Verify membership
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId: message.conversationId, userId, leftAt: null },
    });

    if (!participant)
      throw new ForbiddenException('You are not a member of this conversation');

    await this.prisma.messageDeletedFor.create({
      data: { messageId, userId },
    });

    return { messageId };
  }

  // ─── Read receipts ────────────────────────────────────────

  async markRead(userId: string, conversationId: string, messageId: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.conversationParticipant.updateMany({
        where: { conversationId, userId, leftAt: null },
        data: {
          lastReadMessageId: messageId,
          lastReadAt: new Date(),
          unreadCount: 0,
        },
      });

      await tx.messageReadReceipt.upsert({
        where: {
          messageId_userId: { messageId, userId },
        },
        create: { messageId, userId },
        update: { readAt: new Date() },
      });
    });

    return { userId, messageId, conversationId };
  }

  // ─── Reactions ────────────────────────────────────────────

  async toggleReaction(userId: string, messageId: string, emoji: string) {
    const existing = await this.prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: { messageId, userId, emoji },
      },
    });

    if (existing) {
      await this.prisma.messageReaction.delete({
        where: { id: existing.id },
      });
    } else {
      await this.prisma.messageReaction.create({
        data: { messageId, userId, emoji },
      });
    }

    // Return updated reactions for this message
    const reactions = await this.prisma.messageReaction.findMany({
      where: { messageId },
      select: {
        id: true,
        emoji: true,
        userId: true,
        user: { select: USER_SELECT },
      },
    });

    return { messageId, reactions };
  }

  // ─── Get participant IDs for broadcasting ─────────────────

  async getParticipantIds(conversationId: string): Promise<string[]> {
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId, leftAt: null },
      select: { userId: true },
    });
    return participants.map((p) => p.userId);
  }

  async getUserConversationIds(userId: string): Promise<string[]> {
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { userId, leftAt: null },
      select: { conversationId: true },
    });
    return participants.map((p) => p.conversationId);
  }
}
