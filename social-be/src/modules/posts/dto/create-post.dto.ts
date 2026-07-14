import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { plainToInstance, Transform, Type } from 'class-transformer';
import { ReplyPrivacyDto } from './reply-privacy.dto';

export class PostThemeDto {
  @ApiPropertyOptional({
    example: 'preset',
  })
  @IsString()
  type!: string;

  @ApiPropertyOptional({
    example: 'linear-gradient(135deg, #1877f2, #9b5cff)',
  })
  @IsString()
  background!: string;
}

export class CreatePostDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty()
  @Transform(({ value }) => {
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      return plainToInstance(ReplyPrivacyDto, parsed);
    } catch (error) {
      return value;
    }
  })
  @ValidateNested()
  @Type(() => ReplyPrivacyDto)
  replyPrivacy!: ReplyPrivacyDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gifUrl?: string;

  @ApiPropertyOptional({
    type: PostThemeDto,
  })
  @IsOptional()
  @Transform(({ value }) => {
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      return plainToInstance(PostThemeDto, parsed);
    } catch (error) {
      return value;
    }
  })
  @IsObject()
  @ValidateNested()
  @Type(() => PostThemeDto)
  postTheme?: PostThemeDto;
}
