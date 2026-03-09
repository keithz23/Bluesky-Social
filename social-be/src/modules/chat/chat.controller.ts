import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { ConversationQueryDto, MessageQueryDto } from './dto/message-query.dto';

@Controller('conversations')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  getConversations(
    @CurrentUser('id') userId: string,
    @Query() query: ConversationQueryDto,
  ) {
    return this.chatService.getConversations(userId, query);
  }

  @Post()
  createConversation(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.createConversation(userId, dto);
  }

  @Get(':id')
  getConversation(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.chatService.getConversation(userId, id);
  }

  @Patch(':id')
  updateConversation(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
  ) {
    return this.chatService.updateConversation(userId, id, dto);
  }

  @Delete(':id')
  deleteConversation(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.chatService.deleteConversation(userId, id);
  }

  @Get(':id/messages')
  getMessages(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query() query: MessageQueryDto,
  ) {
    return this.chatService.getMessages(userId, id, query);
  }

  @Post(':id/messages')
  sendMessage(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: { content: string; type?: string },
  ) {
    return this.chatService.createMessage(userId, {
      conversationId: id,
      content: body.content,
      type: body.type,
    });
  }
}
