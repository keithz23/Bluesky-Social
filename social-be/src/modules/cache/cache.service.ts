import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis-client.token';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly subscribers = new Set<Redis>();

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.setex(key, ttl, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async ping(): Promise<boolean> {
    return (await this.redis.ping()) === 'PONG';
  }

  async setWithExpire(
    key: string,
    value: string,
    seconds: number,
  ): Promise<void> {
    await this.redis.setex(key, seconds, value);
  }

  async publish(channel: string, payload = ''): Promise<void> {
    await this.redis.publish(channel, payload);
  }

  async subscribe(
    channel: string,
    handler: (payload: string) => void | Promise<void>,
  ): Promise<() => Promise<void>> {
    const subscriber = this.redis.duplicate();
    this.subscribers.add(subscriber);

    subscriber.on('message', (receivedChannel, payload) => {
      if (receivedChannel === channel) {
        void Promise.resolve(handler(payload)).catch((error: unknown) => {
          this.logger.error(
            `Redis subscription handler failed for channel "${channel}"`,
            error instanceof Error ? error.stack : String(error),
          );
        });
      }
    });
    await subscriber.subscribe(channel);

    return async () => {
      this.subscribers.delete(subscriber);
      await subscriber.unsubscribe(channel);
      subscriber.disconnect();
    };
  }

  async onModuleDestroy(): Promise<void> {
    for (const subscriber of this.subscribers) subscriber.disconnect();
    this.subscribers.clear();
  }
}
