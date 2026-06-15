import { IsOptional, IsString, IsEnum } from 'class-validator';

export class SendMessageDto {
  @IsString()
  conversationId!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'FILE'])
  type?: string = 'TEXT';

  @IsOptional()
  @IsString()
  replyToId?: string;
}
