import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { UploadModule } from 'src/uploads/upload.module';
import { ChatConversationService } from './services/chat-conversation.service';
import { ChatMessageService } from './services/chat-message.service';

@Module({
  imports: [PrismaModule, JwtModule, UploadModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, ChatConversationService, ChatMessageService],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
