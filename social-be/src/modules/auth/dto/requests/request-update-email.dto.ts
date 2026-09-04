import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';
import { EMAIL_MAX_LENGTH } from '../shared';

export class RequestUpdateEmailDto {
  @ApiProperty({ example: 'new.email@example.com' })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(EMAIL_MAX_LENGTH)
  newEmail!: string;
}
