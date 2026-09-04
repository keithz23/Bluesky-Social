import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import {
  PASSWORD_MAX_LENGTH,
  SECOND_FACTOR_CODE_MESSAGE,
  SECOND_FACTOR_CODE_PATTERN,
} from '../shared';

export class Disable2FADto {
  @ApiProperty({ example: 'CurrentPass123!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(PASSWORD_MAX_LENGTH)
  password!: string;

  @ApiProperty({ example: '123456 or KNT-ABCD-EFGH-JKLM' })
  @IsString()
  @IsNotEmpty()
  @Matches(SECOND_FACTOR_CODE_PATTERN, {
    message: SECOND_FACTOR_CODE_MESSAGE,
  })
  otp!: string;
}
