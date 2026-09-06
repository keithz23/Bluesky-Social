import { ApiProperty } from '@nestjs/swagger';
import {
  LOGIN_2FA_METHODS,
  Login2FAMethod,
} from '../shared/auth-validation.constants';

export class Login2FAChallengeResponseDto {
  @ApiProperty({ example: true })
  requires2FA!: true;

  @ApiProperty()
  challengeId!: string;

  @ApiProperty({ enum: LOGIN_2FA_METHODS, isArray: true })
  methods!: Login2FAMethod[];

  @ApiProperty({ example: 'j***e@e***e.com' })
  maskedEmail!: string;
}
