import { CookieOptions } from 'express';

const isProduction = process.env.NODE_ENV === 'production';

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'strict' : 'lax',
  path: '/',
  ...(isProduction ? { domain: '.th-red.app' } : {}),
};

export const accessTokenCookieOptions = {
  ...cookieOptions,
  maxAge: 15 * 60 * 1000, // 15 mins
};

export const refreshTokenCookieOptions = {
  ...cookieOptions,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
