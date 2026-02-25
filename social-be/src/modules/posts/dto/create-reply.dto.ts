import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateReplyDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  gifUrl?: string;
}
