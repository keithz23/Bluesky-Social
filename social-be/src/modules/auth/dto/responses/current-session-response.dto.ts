import { ApiProperty } from '@nestjs/swagger';
import { CurrentUserResponseDto } from 'src/modules/users/dto/responses';
import { RoleResponseDto } from './role-response.dto';

/** Current account and authorization context without issuing new tokens. */
export class CurrentSessionResponseDto {
  @ApiProperty({ type: CurrentUserResponseDto })
  user!: CurrentUserResponseDto;

  @ApiProperty({ type: [RoleResponseDto] })
  roles!: RoleResponseDto[];
}
