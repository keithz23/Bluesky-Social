export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const EMAIL_MAX_LENGTH = 254;

export const STRONG_PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;

export const STRONG_PASSWORD_MESSAGE =
  'Password must contain uppercase, lowercase, number and special character';

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
export const USERNAME_PATTERN_MESSAGE =
  'Username can only contain letters, numbers and underscores';

// Email-delivered account codes use the XXXXX-XXXXX format.
export const ACCOUNT_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{5}-?[A-HJ-NP-Z2-9]{5}$/i;
export const ACCOUNT_CODE_MESSAGE =
  'Verification code must use the XXXXX-XXXXX format';

export const TOTP_CODE_PATTERN = /^\d{6}$/;
export const TOTP_CODE_MESSAGE = 'Authenticator code must contain 6 digits';

export const RECOVERY_CODE_PATTERN =
  /^KNT-?[A-HJ-NP-Z2-9]{4}-?[A-HJ-NP-Z2-9]{4}-?[A-HJ-NP-Z2-9]{4}$/i;
export const SECOND_FACTOR_CODE_PATTERN = new RegExp(
  `(?:${TOTP_CODE_PATTERN.source})|(?:${RECOVERY_CODE_PATTERN.source})`,
  'i',
);
export const SECOND_FACTOR_CODE_MESSAGE =
  'Enter a 6-digit authenticator code or a valid recovery code';

export const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const DATE_ONLY_MESSAGE = 'Date must use the YYYY-MM-DD format';

export const LOGIN_2FA_METHODS = ['totp', 'recovery_code'] as const;
export type Login2FAMethod = (typeof LOGIN_2FA_METHODS)[number];
