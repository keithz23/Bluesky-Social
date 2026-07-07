import {
  IsString,
  IsOptional,
  MaxLength,
  IsUrl,
  IsBoolean,
  IsArray,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John Doe', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;

  @ApiPropertyOptional({
    example: 'Software Developer | Coffee Lover ☕',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bio?: string;

  @IsOptional()
  avatarUrl!: string;

  @IsOptional()
  coverUrl!: string;
}
