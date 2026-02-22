export type MailType =
  | 'verify'
  | 'reset'
  | 'welcome'
  | 'send-notification'
  | 'forgot';

export interface SendMailDto {
  to: string;
  subject?: string;
  type: MailType;
  context: Record<string, any>; // {token, name,...}
}
