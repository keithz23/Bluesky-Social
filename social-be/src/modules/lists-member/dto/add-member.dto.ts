import { ApiProperty } from '@nestjs/swagger';

export class AddMembersDto {
  @ApiProperty()
  participantId: string;
}
