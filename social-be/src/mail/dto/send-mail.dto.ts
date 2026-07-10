export type MailType =
  | 'verify'
  | 'reset'
  | 'welcome'
  | 'send-notification'
  | 'forgot'
  | 'request-email-otp'
  | 'request-password-otp'
  | 'request-deactivate-account-otp'
  | 'request-enable-2fa'
  | 'login-2fa'
  | 'request-disable-2fa';

export type AccountCodeMailPurpose =
  | 'password-reset'
  | 'email-update'
  | 'password-update'
  | 'deactivate-account'
  | 'enable-2fa'
  | 'login-2fa'
  | 'disable-2fa';

export interface SendMailDto {
  to: string;
  subject?: string;
  type: MailType;
  context: Record<string, any>; // {token, name,...}
}
