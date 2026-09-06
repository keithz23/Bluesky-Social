import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { TOTP_CODE_MESSAGE, TOTP_CODE_PATTERN } from '../shared';

export class Enable2FADto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  @Matches(TOTP_CODE_PATTERN, { message: TOTP_CODE_MESSAGE })
  otp!: string;
}
