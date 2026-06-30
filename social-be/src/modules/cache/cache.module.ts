import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createRedisOptions } from 'src/config/redis-options';
import { CacheService } from './cache.service';
import { REDIS_CLIENT } from './redis-client.token';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        return new Redis(
          createRedisOptions(cfg, {
          maxRetriesPerRequest: 3,
          }),
        );
      },
    },
    CacheService,
  ],
  exports: [REDIS_CLIENT, CacheService],
})
export class CacheModule { }
