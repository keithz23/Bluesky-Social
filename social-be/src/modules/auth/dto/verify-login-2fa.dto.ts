import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyLogin2FADto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  challengeId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  otp!: string;
}
