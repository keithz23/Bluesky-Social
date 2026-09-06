import { Injectable } from '@nestjs/common';
import { CreateConversationDto } from './dto/requests/create-conversation.dto';
import {
  ConversationQueryDto,
  MessageQueryDto,
} from './dto/requests/message-query.dto';
import { SendMessageDto } from './dto/requests/send-message.dto';
import { UpdateConversationDto } from './dto/requests/update-conversation.dto';
import { ChatConversationService } from './services/chat-conversation.service';
import { ChatMessageService } from './services/chat-message.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly conversations: ChatConversationService,
    private readonly messages: ChatMessageService,
  ) {}

  getConversations(userId: string, query: ConversationQueryDto) {
    return this.conversations.getConversations(userId, query);
  }

  getConversation(userId: string, conversationId: string) {
    return this.conversations.getConversation(userId, conversationId);
  }

  createConversation(userId: string, dto: CreateConversationDto) {
    return this.conversations.createConversation(userId, dto);
  }

  updateConversation(
    userId: string,
    conversationId: string,
    dto: UpdateConversationDto,
  ) {
    return this.conversations.updateConversation(userId, conversationId, dto);
  }

  deleteConversation(userId: string, conversationId: string) {
    return this.conversations.deleteConversation(userId, conversationId);
  }

  getMessages(userId: string, conversationId: string, query: MessageQueryDto) {
    return this.messages.getMessages(userId, conversationId, query);
  }

  createMessage(userId: string, dto: SendMessageDto) {
    return this.messages.createMessage(userId, dto);
  }

  createImageMessage(
    userId: string,
    conversationId: string,
    file: Express.Multer.File,
    content?: string,
  ) {
    return this.messages.createImageMessage(userId, conversationId, file, content);
  }

  editMessage(userId: string, messageId: string, content: string) {
    return this.messages.editMessage(userId, messageId, content);
  }

  deleteMessage(userId: string, messageId: string) {
    return this.messages.deleteMessage(userId, messageId);
  }

  deleteMessageForMe(userId: string, messageId: string) {
    return this.messages.deleteMessageForMe(userId, messageId);
  }

  markRead(userId: string, conversationId: string, messageId: string) {
    return this.messages.markRead(userId, conversationId, messageId);
  }

  toggleReaction(userId: string, messageId: string, emoji: string) {
    return this.messages.toggleReaction(userId, messageId, emoji);
  }

  getParticipantIds(conversationId: string): Promise<string[]> {
    return this.messages.getParticipantIds(conversationId);
  }

  getUserConversationIds(userId: string): Promise<string[]> {
    return this.conversations.getUserConversationIds(userId);
  }
}
