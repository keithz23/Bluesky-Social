import { User } from '@prisma/client';
import { AuthResponseDto } from 'src/modules/auth/dto/auth-response.dto';

export type AccountEmailCodePurpose =
  | 'password-reset'
  | 'email-update'
  | 'password-update'
  | 'deactivate-account'
  | 'enable-2fa'
  | 'disable-2fa';

export interface AccountEmailCodePayload {
  user: Pick<User, 'id' | 'email' | 'username'>;
  purpose: AccountEmailCodePurpose;
  metadata?: Record<string, unknown>;
  userAgent?: string;
  ipAddress?: string;
}

export interface AuditContext {
  userAgent?: string;
  ipAddress?: string;
}

export interface AccountEmailCodeData {
  otpHash?: string;
  otp?: string;
}

export interface Login2FAChallengeResponse {
  requires2FA: true;
  challengeId: string;
  methods: Array<'totp' | 'recovery_code'>;
  maskedEmail: string;
}

export type LoginResponse = AuthResponseDto | Login2FAChallengeResponse;

export interface Login2FAChallengeData {
  userId: string;
  attempts: number;
  createdIp?: string;
  createdUa?: string;
}

export interface TotpSetupData {
  secret: string;
  createdIp?: string;
  createdUa?: string;
}
