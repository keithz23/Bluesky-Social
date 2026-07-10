import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyLogin2FADto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  challengeId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  otp!: string;

  @ApiProperty({ required: false, enum: ['totp', 'recovery_code'] })
  @IsOptional()
  @IsString()
  @IsIn(['totp', 'recovery_code'])
  method?: 'totp' | 'recovery_code';
}
