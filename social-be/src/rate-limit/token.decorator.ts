import { SetMetadata } from '@nestjs/common';

export interface RateLimitOptions {
  capacity: number;
  refillRate: number; // tokens/sec
}

export const RATE_LIMIT_KEY = 'rate_limit';
export const DEFAULT_RATE_LIMIT: RateLimitOptions = {
  capacity: 100,
  refillRate: 100 / 60,
};

export const RateLimit = (options: RateLimitOptions = DEFAULT_RATE_LIMIT) =>
  SetMetadata(RATE_LIMIT_KEY, options);
