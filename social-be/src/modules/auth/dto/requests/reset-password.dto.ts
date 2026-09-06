import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  ACCOUNT_CODE_MESSAGE,
  ACCOUNT_CODE_PATTERN,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  STRONG_PASSWORD_MESSAGE,
  STRONG_PASSWORD_PATTERN,
} from '../shared';

export class ResetPasswordDto {
  @ApiProperty({ example: 'ABCDE-23456' })
  @IsString()
  @IsNotEmpty()
  @Matches(ACCOUNT_CODE_PATTERN, { message: ACCOUNT_CODE_MESSAGE })
  code!: string;

  @ApiProperty({ example: 'NewPass123!', minLength: PASSWORD_MIN_LENGTH })
  @IsString()
  @IsNotEmpty()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @Matches(STRONG_PASSWORD_PATTERN, {
    message: STRONG_PASSWORD_MESSAGE,
  })
  newPassword!: string;
}
