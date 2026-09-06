import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';
import { EMAIL_MAX_LENGTH } from 'src/common/constants/user-validation.constant';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(EMAIL_MAX_LENGTH)
  email!: string;
}
