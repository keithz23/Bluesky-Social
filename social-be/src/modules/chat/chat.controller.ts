import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { ConversationQueryDto, MessageQueryDto } from './dto/message-query.dto';
import 'multer';

@Controller('conversations')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

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

  @Post(':id/messages/media')
  @UseInterceptors(FileInterceptor('file'))
  async sendMediaMessage(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('content') content?: string,
  ) {
    const message = await this.chatService.createImageMessage(
      userId,
      id,
      file,
      content,
    );
    await this.chatGateway.emitNewMessage(userId, id, message);
    return message;
  }
}
