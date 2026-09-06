import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import {
  LOGIN_2FA_METHODS,
  Login2FAMethod,
  SECOND_FACTOR_CODE_MESSAGE,
  SECOND_FACTOR_CODE_PATTERN,
} from '../shared';

export class VerifyLogin2FADto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  challengeId!: string;

  @ApiProperty({ example: '123456 or KNT-ABCD-EFGH-JKLM' })
  @IsString()
  @IsNotEmpty()
  @Matches(SECOND_FACTOR_CODE_PATTERN, {
    message: SECOND_FACTOR_CODE_MESSAGE,
  })
  otp!: string;

  @ApiProperty({ required: false, enum: LOGIN_2FA_METHODS })
  @IsOptional()
  @IsIn(LOGIN_2FA_METHODS)
  method?: Login2FAMethod;
}
