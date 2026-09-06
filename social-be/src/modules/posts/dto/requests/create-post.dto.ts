import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  plainToInstance,
  Transform,
  TransformFnParams,
  Type,
} from 'class-transformer';
import { ReplyPrivacyDto } from './reply-privacy.dto';

function transformJsonDto<T>(value: unknown, dto: new () => T): unknown {
  try {
    const parsed: unknown =
      typeof value === 'string' ? (JSON.parse(value) as unknown) : value;

    return typeof parsed === 'object' && parsed !== null
      ? plainToInstance(dto, parsed)
      : parsed;
  } catch {
    return value;
  }
}

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
  @Transform(({ value }: TransformFnParams) =>
    transformJsonDto(value as unknown, ReplyPrivacyDto),
  )
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
  @Transform(({ value }: TransformFnParams) =>
    transformJsonDto(value as unknown, PostThemeDto),
  )
  @IsObject()
  @ValidateNested()
  @Type(() => PostThemeDto)
  postTheme?: PostThemeDto;
}
