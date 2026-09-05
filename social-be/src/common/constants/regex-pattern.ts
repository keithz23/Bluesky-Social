import { USERNAME_WITH_LENGTH_PATTERN } from './user-validation.constant';

export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: USERNAME_WITH_LENGTH_PATTERN,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
  MENTION: /@(\w+)/g,
  HASHTAG: /#(\w+)/g,
};
