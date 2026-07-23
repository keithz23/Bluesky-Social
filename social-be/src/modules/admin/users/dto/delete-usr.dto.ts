import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty } from 'class-validator';

export class DeleteUserDto {
  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  userIds!: string[];
}
