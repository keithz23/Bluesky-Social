import { ApiProperty } from '@nestjs/swagger';
import { CurrentUserResponseDto } from './current-user-response.dto';
import { RoleResponseDto } from './role-response.dto';

/** Current account and authorization context without issuing new tokens. */
export class CurrentSessionResponseDto {
  @ApiProperty({ type: CurrentUserResponseDto })
  user!: CurrentUserResponseDto;

  @ApiProperty({ type: [RoleResponseDto] })
  roles!: RoleResponseDto[];
}
