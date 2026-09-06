import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConversationType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateConversationDto } from '../dto/requests/create-conversation.dto';
import {
  ConversationQueryDto,
} from '../dto/requests/message-query.dto';
import { UpdateConversationDto } from '../dto/requests/update-conversation.dto';
import {
  CHAT_CONVERSATION_SELECT,
  ConversationCursor,
  decodeChatCursor,
  encodeChatCursor,
} from './chat-selectors';

@Injectable()
export class ChatConversationService {
  constructor(private readonly prisma: PrismaService) {}

  async getConversations(userId: string, query: ConversationQueryDto) {
    const limit = query.limit ?? 20;
    const cursor = decodeChatCursor<ConversationCursor>(query.cursor);

    if (query.cursor && !cursor) {
      throw new BadRequestException('Invalid cursor');
    }

    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId, leftAt: null },
        },
        ...(cursor?.lastMessageAt
          ? {
              OR: [
                { lastMessageAt: { lt: new Date(cursor.lastMessageAt) } },
                { lastMessageAt: null },
                {
                  lastMessageAt: new Date(cursor.lastMessageAt),
                  createdAt: { lt: new Date(cursor.createdAt) },
                },
                {
                  lastMessageAt: new Date(cursor.lastMessageAt),
                  createdAt: new Date(cursor.createdAt),
                  id: { lt: cursor.id },
                },
              ],
            }
          : cursor
            ? {
                lastMessageAt: null,
                OR: [
                  { createdAt: { lt: new Date(cursor.createdAt) } },
                  {
                    createdAt: new Date(cursor.createdAt),
                    id: { lt: cursor.id },
                  },
                ],
              }
            : {}),
      },
      orderBy: [
        { lastMessageAt: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
      take: limit + 1,
      select: CHAT_CONVERSATION_SELECT,
    });

    const hasMore = conversations.length > limit;
    if (hasMore) conversations.pop();

    const lastConversation = conversations[conversations.length - 1];
    const nextCursor =
      hasMore && lastConversation
        ? encodeChatCursor({
            lastMessageAt:
              lastConversation.lastMessageAt?.toISOString() ?? null,
            createdAt: lastConversation.createdAt.toISOString(),
            id: lastConversation.id,
          })
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
      select: CHAT_CONVERSATION_SELECT,
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async createConversation(userId: string, dto: CreateConversationDto) {
    const { type, participantIds, name } = dto;

    const users = await this.prisma.user.findMany({
      where: { id: { in: participantIds } },
      select: { id: true },
    });

    if (users.length !== participantIds.length) {
      throw new BadRequestException('One or more users not found');
    }

    if (type === 'DIRECT') {
      if (participantIds.length !== 1) {
        throw new BadRequestException(
          'Direct conversation requires exactly one other participant',
        );
      }

      const targetUserId = participantIds[0];

      if (targetUserId === userId) {
        throw new BadRequestException(
          'Cannot start a conversation with yourself',
        );
      }

      const existing = await this.prisma.conversation.findFirst({
        where: {
          type: ConversationType.DIRECT,
          AND: [
            { participants: { some: { userId, leftAt: null } } },
            { participants: { some: { userId: targetUserId, leftAt: null } } },
          ],
        },
        select: CHAT_CONVERSATION_SELECT,
      });

      if (existing) return existing;
    }

    const allParticipantIds = [userId, ...participantIds];

    return this.prisma.conversation.create({
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
      select: CHAT_CONVERSATION_SELECT,
    });
  }

  async updateConversation(
    userId: string,
    conversationId: string,
    dto: UpdateConversationDto,
  ) {
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId, leftAt: null },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a member of this conversation');
    }

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

    if (!participant) {
      throw new ForbiddenException('You are not a member of this conversation');
    }

    await this.prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { leftAt: new Date() },
    });

    return { message: 'Left conversation successfully' };
  }

  async getUserConversationIds(userId: string): Promise<string[]> {
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { userId, leftAt: null },
      select: { conversationId: true },
    });

    return participants.map((participant) => participant.conversationId);
  }
}
