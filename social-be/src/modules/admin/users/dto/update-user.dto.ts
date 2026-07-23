import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: '1999-05-15',
  })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  dateOfBirth!: Date;

  @ApiProperty()
  @IsEnum(UserStatus)
  status!: UserStatus;

  @ApiPropertyOptional()
  @IsOptional()
  roleIds?: string[];
}
