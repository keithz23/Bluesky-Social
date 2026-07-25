import { Global, Module } from '@nestjs/common';
import { TokenBucketService } from './token-bucket.service';
import { RateLimitGuard } from './rate-limit.guard';

@Global()
@Module({
  providers: [TokenBucketService, RateLimitGuard],
  exports: [TokenBucketService, RateLimitGuard],
})
export class RateLimitModule {}
