import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export class MessageAttachmentDto {
  @IsString()
  url!: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsString()
  fileName!: string;

  fileSize!: number;

  @IsString()
  mimeType!: string;

  @IsOptional()
  width?: number;

  @IsOptional()
  height?: number;
}

export class SendMessageDto {
  @IsString()
  conversationId!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'STICKER'])
  type?: string = 'TEXT';

  @IsOptional()
  @IsString()
  replyToId?: string;

  @IsOptional()
  @IsArray()
  attachments?: MessageAttachmentDto[];
}
