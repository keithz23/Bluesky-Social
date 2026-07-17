export interface ImagePreview {
  file: File;
  preview: string;
}

export interface FloatingPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

export interface PostColorTheme {
  id: string;
  label: string;
  background: string;
  textColor: string;
  placeholderColor: string;
  swatch: string;
}

export interface EditableProfile {
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
}

export type TwoFactorMethod = "totp";

export type Enable2FAStep =
  "select-method" | "email-verification" | "totp-setup" | "recovery-codes";

export interface TOTPSetupData {
  secret: string;
  qrCodeDataUrl: string;
}
