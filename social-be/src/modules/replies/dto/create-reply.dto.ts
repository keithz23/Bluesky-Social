import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateReplyDto {
  @ApiPropertyOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsString()
  gifUrl?: string;

  @ApiProperty()
  @IsString()
  postId: string;
}
