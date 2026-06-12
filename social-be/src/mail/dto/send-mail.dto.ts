export type MailType =
  | 'verify'
  | 'reset'
  | 'welcome'
  | 'send-notification'
  | 'forgot'
  | 'request-email-otp'
  | 'request-password-otp';

export type AccountCodeMailPurpose =
  | 'password-reset'
  | 'email-update'
  | 'password-update';

export interface SendMailDto {
  to: string;
  subject?: string;
  type: MailType;
  context: Record<string, any>; // {token, name,...}
}
