export const EMAIL_MAX_LENGTH = 254;

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

/** Accepted when creating or changing a username. */
export const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
export const USERNAME_WITH_LENGTH_PATTERN = new RegExp(
  `^[a-zA-Z0-9_]{${USERNAME_MIN_LENGTH},${USERNAME_MAX_LENGTH}}$`,
);
export const USERNAME_PATTERN_MESSAGE =
  'Username can only contain letters, numbers and underscores';

/** Also accepts periods so existing OAuth-generated usernames remain addressable. */
export const USERNAME_LOOKUP_PATTERN = /^[a-zA-Z0-9_.]+$/;
export const USERNAME_LOOKUP_PATTERN_MESSAGE =
  'Username can only contain letters, numbers, periods and underscores';

export const DISPLAY_NAME_MAX_LENGTH = 50;
export const BIO_MAX_LENGTH = 100;

export const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const DATE_ONLY_MESSAGE = 'Date must use the YYYY-MM-DD format';
