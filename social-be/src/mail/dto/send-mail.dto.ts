export type MailType =
  | 'verify'
  | 'reset'
  | 'welcome'
  | 'send-notification'
  | 'forgot'
  | 'request-email-otp'

export interface SendMailDto {
  to: string;
  subject?: string;
  type: MailType;
  context: Record<string, any>; // {token, name,...}
}
