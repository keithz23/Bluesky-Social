import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsNotEmpty,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  DATE_ONLY_MESSAGE,
  DATE_ONLY_PATTERN,
  STRONG_PASSWORD_MESSAGE,
  STRONG_PASSWORD_PATTERN,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
  USERNAME_PATTERN_MESSAGE,
} from '../shared';

export class RegisterDto {
  @ApiProperty({
    example: 'johndoe',
    description:
      'Unique username (3-30 characters, alphanumeric and underscores only)',
  })
  @IsString()
  @MinLength(USERNAME_MIN_LENGTH)
  @MaxLength(USERNAME_MAX_LENGTH)
  @Matches(USERNAME_PATTERN, {
    message: USERNAME_PATTERN_MESSAGE,
  })
  username!: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Valid email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'StrongPass123!',
    description:
      'Password (min 8 chars, must contain uppercase, lowercase, number and special character)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @Matches(STRONG_PASSWORD_PATTERN, {
    message: STRONG_PASSWORD_MESSAGE,
  })
  password!: string;

  @ApiProperty({
    example: '1999-05-15',
    type: String,
    format: 'date',
  })
  @IsNotEmpty()
  @Matches(DATE_ONLY_PATTERN, { message: DATE_ONLY_MESSAGE })
  @IsDateString({ strict: true })
  dateOfBirth!: string;
}
