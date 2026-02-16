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
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ example: 'https://example.com' })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const v = value.trim();
      return v === '' ? undefined : v;
    }
    return value;
  })
  @ValidateIf((o) => o.website !== undefined)
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ example: 'San Francisco, CA' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Make account private (requires approval for follows)',
  })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  linkTitle?: string;

  @ApiPropertyOptional({ example: 'https://example.com' })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const v = value.trim();
      return v === '' ? undefined : v;
    }
    return value;
  })
  @ValidateIf((o) => o.link !== undefined)
  @IsUrl()
  link?: string;

  @ApiPropertyOptional({ example: ['music', 'coding', 'chilling'] })
  @IsArray()
  @IsOptional()
  interests?: string[];
}
