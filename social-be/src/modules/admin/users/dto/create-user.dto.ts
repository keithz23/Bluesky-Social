import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    example: '1999-05-15',
  })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  dateOfBirth!: Date;

  @ApiProperty()
  @IsOptional()
  roleIds!: string[];
}
