import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class Setup2FADto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password!: string;
}
