import { ApiProperty } from '@nestjs/swagger';
import { KeywordAction } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateKeywordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  word!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ruleId!: string;

  @ApiProperty()
  @IsEnum(KeywordAction)
  action!: KeywordAction;
}
