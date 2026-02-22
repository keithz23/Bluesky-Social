import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { plainToInstance, Transform, Type } from 'class-transformer';
import { ReplyPrivacyDto } from './reply-privacy.dto';

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
  replyPrivacy: ReplyPrivacyDto;

  @ApiProperty()
  @IsOptional()
  @IsString()
  gifUrl?: string;
}
