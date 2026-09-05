import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import {
  BIO_MAX_LENGTH,
  DISPLAY_NAME_MAX_LENGTH,
} from 'src/common/constants/user-validation.constant';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'John Doe',
    maxLength: DISPLAY_NAME_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(DISPLAY_NAME_MAX_LENGTH)
  displayName?: string;

  @ApiPropertyOptional({
    example: 'Software Developer | Coffee Lover ☕',
    maxLength: BIO_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(BIO_MAX_LENGTH)
  bio?: string;
}
