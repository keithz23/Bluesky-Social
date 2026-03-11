import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RemoveMemberDto {
  @ApiProperty()
  @IsString()
  userIdToRemove: string;
}
