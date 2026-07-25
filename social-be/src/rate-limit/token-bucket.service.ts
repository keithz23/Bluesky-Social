import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import * as fs from 'fs';
import * as path from 'path';
import { REDIS_CLIENT } from 'src/modules/cache/redis-client.token';

@Injectable()
export class TokenBucketService implements OnModuleInit {
  private scriptSha!: string;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleInit() {
    const script = fs.readFileSync(
      path.join(__dirname, 'token-bucket.lua'),
      'utf-8',
    );

    this.scriptSha = (await this.redis.script('LOAD', script)) as string;
  }

  async consume(
    key: string,
    capacity: number,
    refillRate: number,
    requested = 1,
  ): Promise<{ allowed: boolean; remaining: number }> {
    const now = Date.now();
    const [allowed, remaining] = (await this.redis.evalsha(
      this.scriptSha,
      1,
      key,
      capacity,
      refillRate,
      now,
      requested,
    )) as [number, number];

    return { allowed: allowed === 1, remaining };
  }
}
