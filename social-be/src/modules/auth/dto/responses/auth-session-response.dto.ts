import { ApiProperty } from '@nestjs/swagger';
import { CurrentUserResponseDto } from './current-user-response.dto';
import { RoleResponseDto } from './role-response.dto';

/** A newly-issued authenticated session (login, 2FA verification, refresh). */
export class AuthSessionResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken!: string;

  // Kept for backward compatibility. Prefer an HttpOnly refresh-token cookie.
  @ApiProperty({ description: 'JWT refresh token' })
  refreshToken!: string;

  @ApiProperty({ type: CurrentUserResponseDto })
  user!: CurrentUserResponseDto;

  @ApiProperty({ type: [RoleResponseDto] })
  roles!: RoleResponseDto[];
}
