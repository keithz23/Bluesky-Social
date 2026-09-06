import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MessageType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { S3Service } from 'src/uploads/s3.service';
import {
  MessageQueryDto,
} from '../dto/requests/message-query.dto';
import { SendMessageDto } from '../dto/requests/send-message.dto';
import {
  CHAT_MESSAGE_SELECT,
  CHAT_USER_SELECT,
  decodeChatCursor,
  encodeChatCursor,
  MessageCursor,
} from './chat-selectors';

@Injectable()
export class ChatMessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async getMessages(
    userId: string,
    conversationId: string,
    query: MessageQueryDto,
  ) {
    await this.assertParticipant(userId, conversationId);

    const limit = query.limit ?? 30;
    const cursor = decodeChatCursor<MessageCursor>(query.cursor);

    if (query.cursor && !cursor) {
      throw new BadRequestException('Invalid cursor');
    }

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        NOT: {
          deletedFor: { some: { userId } },
        },
        ...(cursor && {
          OR: [
            { createdAt: { lt: new Date(cursor.createdAt) } },
            {
              createdAt: new Date(cursor.createdAt),
              id: { lt: cursor.id },
            },
          ],
        }),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      select: CHAT_MESSAGE_SELECT,
    });

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();

    const lastMessage = messages[messages.length - 1];
    const nextCursor =
      hasMore && lastMessage
        ? encodeChatCursor({
            createdAt: lastMessage.createdAt.toISOString(),
            id: lastMessage.id,
          })
        : null;

    return { messages, nextCursor };
  }

  async createMessage(userId: string, dto: SendMessageDto) {
    const { conversationId, content, type, replyToId, attachments } = dto;

    await this.assertParticipant(userId, conversationId);

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: content ?? '',
          type: (type as MessageType) ?? MessageType.TEXT,
          replyToId: replyToId ?? null,
          attachments: attachments?.length
            ? {
                create: attachments.map((attachment) => ({
                  url: attachment.url,
                  thumbnailUrl: attachment.thumbnailUrl ?? null,
                  fileName: attachment.fileName,
                  fileSize: attachment.fileSize,
                  mimeType: attachment.mimeType,
                  width: attachment.width ?? null,
                  height: attachment.height ?? null,
                })),
              }
            : undefined,
        },
        select: CHAT_MESSAGE_SELECT,
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageId: created.id,
          lastMessageAt: new Date(),
          messageCount: { increment: 1 },
        },
      });

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
  }

  async createImageMessage(
    userId: string,
    conversationId: string,
    file: Express.Multer.File,
    content?: string,
  ) {
    if (!file?.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Only image files are supported');
    }

    const upload = await this.s3Service.uploadImage(
      file,
      `chat/${conversationId}`,
      { resize: true, quality: 85 },
    );

    return this.createMessage(userId, {
      conversationId,
      content,
      type: 'IMAGE',
      attachments: [
        {
          url: upload.url,
          thumbnailUrl: upload.url,
          fileName: file.originalname,
          fileSize: upload.size,
          mimeType: upload.mimetype,
        },
      ],
    });
  }

  async editMessage(userId: string, messageId: string, content: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
        editedAt: new Date(),
      },
      select: CHAT_MESSAGE_SELECT,
    });
  }

  async deleteMessage(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

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

    await this.assertParticipant(userId, message.conversationId);

    await this.prisma.messageDeletedFor.create({
      data: { messageId, userId },
    });

    return { messageId };
  }

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

    const reactions = await this.prisma.messageReaction.findMany({
      where: { messageId },
      select: {
        id: true,
        emoji: true,
        userId: true,
        user: { select: CHAT_USER_SELECT },
      },
    });

    return { messageId, reactions };
  }

  async getParticipantIds(conversationId: string): Promise<string[]> {
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId, leftAt: null },
      select: { userId: true },
    });

    return participants.map((participant) => participant.userId);
  }

  private async assertParticipant(userId: string, conversationId: string) {
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId, leftAt: null },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a member of this conversation');
    }

    return participant;
  }
}
