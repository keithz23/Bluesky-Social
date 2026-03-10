import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class AddMembersDto {
  @ApiProperty()
  @IsArray()
  participantIds: string[];
}
