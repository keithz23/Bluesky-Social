import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TokenBucketService } from './token-bucket.service';
import {
  DEFAULT_RATE_LIMIT,
  RATE_LIMIT_KEY,
  RateLimitOptions,
} from './token.decorator';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tokenBucket: TokenBucketService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;

    const options =
      this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? DEFAULT_RATE_LIMIT;

    const req = context.switchToHttp().getRequest();
    const identifier = req.user?.id ?? req.ip;
    const routeKey = `${context.getClass().name}:${context.getHandler().name}`;
    const key = `ratelimit:${routeKey}:${identifier}`;

    const { allowed, remaining } = await this.tokenBucket.consume(
      key,
      options.capacity,
      options.refillRate,
    );

    const res = context.switchToHttp().getResponse();
    res.setHeader('X-RateLimit-Limit', options.capacity);
    res.setHeader('X-RateLimit-Remaining', Math.floor(remaining));

    if (!allowed) {
      res.setHeader(
        'Retry-After',
        Math.max(1, Math.ceil(1 / options.refillRate)),
      );
      throw new HttpException(
        'Too Many Requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
