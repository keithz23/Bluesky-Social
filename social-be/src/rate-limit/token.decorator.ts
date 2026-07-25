import { SetMetadata } from '@nestjs/common';

export interface RateLimitOptions {
  capacity: number;
  refillRate: number; // tokens/sec
}

export const RATE_LIMIT_KEY = 'rate_limit';
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);
