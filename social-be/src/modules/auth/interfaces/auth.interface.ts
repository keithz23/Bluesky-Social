import { User } from '@prisma/client';
export type AccountEmailCodePurpose =
  | 'password-reset'
  | 'email-update'
  | 'password-update'
  | 'deactivate-account'
  | 'delete-account'
  | 'enable-2fa'
  | 'disable-2fa';

export interface AccountEmailCodePayload {
  user: Pick<User, 'id' | 'email' | 'username'>;
  purpose: AccountEmailCodePurpose;
  metadata?: Record<string, unknown>;
  userAgent?: string;
  ipAddress?: string;
}

export interface AccountEmailCodeData {
  otpHash?: string;
  otp?: string;
}

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

/** Normalized user shape produced by GoogleStrategy for the auth domain. */
export interface GoogleAuthUser {
  googleId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  picture: string | null;
  accessToken: string;
}
