import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ACCOUNT_CODE_MESSAGE, ACCOUNT_CODE_PATTERN } from '../shared';

export class DeleteAccountDto {
  @ApiProperty({ example: 'ABCDE-23456' })
  @IsString()
  @IsNotEmpty()
  @Matches(ACCOUNT_CODE_PATTERN, { message: ACCOUNT_CODE_MESSAGE })
  otp!: string;
}
