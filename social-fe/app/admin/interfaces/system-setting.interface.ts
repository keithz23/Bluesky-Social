export type SystemSettingKey =
  | "account.registration_enabled"
  | "account.require_email_verification"
  | "content.max_post_length"
  | "moderation.keyword_scan_enabled";

export interface SystemSetting {
  key: SystemSettingKey;
  category: string;
  label: string;
  description: string;
  value: boolean | number;
  defaultValue: boolean | number;
  isDefault: boolean;
  updatedAt: string | null;
  updatedById: string | null;
}

export interface UpdateSystemSettingsPayload {
  registrationEnabled?: boolean;
  requireEmailVerification?: boolean;
  maxPostLength?: number;
  keywordScanEnabled?: boolean;
}
