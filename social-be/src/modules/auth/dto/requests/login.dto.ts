import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PASSWORD_MAX_LENGTH } from '../shared';

export class LoginDto {
  @ApiProperty({
    example: 'johndoe',
    description: 'Username or email',
  })
  @IsString()
  @IsNotEmpty()
  account!: string; // Can be username or email

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(PASSWORD_MAX_LENGTH)
  password!: string;
}
