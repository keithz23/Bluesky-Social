export * from './auth-session-response.dto';
export * from './current-session-response.dto';
export * from './current-user-response.dto';
export * from './login-2fa-challenge-response.dto';
export * from './public-user-response.dto';
export * from './register-response.dto';
export * from './role-response.dto';
export * from './success-response.dto';
export * from './request-password-reset-response.dto';
export * from './get-active-sessions-response.dto';
export * from './enable-2fa-response.dto';

import { AuthSessionResponseDto } from './auth-session-response.dto';
import { Login2FAChallengeResponseDto } from './login-2fa-challenge-response.dto';

export type LoginResponse =
  | AuthSessionResponseDto
  | Login2FAChallengeResponseDto;
