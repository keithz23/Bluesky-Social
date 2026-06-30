import { ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

type ParsedRedisSource = {
  host: string;
  port: number;
  username?: string;
  password?: string;
  tls: boolean;
};

const parseBoolean = (value: unknown) =>
  ['true', '1', 'yes'].includes(String(value).toLowerCase());

const parseRedisSource = (
  source: string | undefined,
  fallbackPort: number,
): ParsedRedisSource => {
  const rawSource = source?.trim();

  if (!rawSource) {
    return { host: 'localhost', port: fallbackPort, tls: false };
  }

  if (rawSource.startsWith('redis://') || rawSource.startsWith('rediss://')) {
    const redisUrl = new URL(rawSource);

    return {
      host: redisUrl.hostname,
      port: Number(redisUrl.port || fallbackPort),
      username: redisUrl.username
        ? decodeURIComponent(redisUrl.username)
        : undefined,
      password: redisUrl.password
        ? decodeURIComponent(redisUrl.password)
        : undefined,
      tls: redisUrl.protocol === 'rediss:',
    };
  }

  const hostWithPort = rawSource.match(/^(.+):(\d+)$/);

  if (hostWithPort) {
    return {
      host: hostWithPort[1],
      port: Number(hostWithPort[2]),
      tls: false,
    };
  }

  return { host: rawSource, port: fallbackPort, tls: false };
};

export const createRedisOptions = (
  configService: ConfigService,
  overrides: RedisOptions = {},
): RedisOptions => {
  const configuredHost = configService.get<string>('config.redis.host');
  const configuredUrl = configService.get<string>('config.redis.url');
  const fallbackPort = Number(
    configService.get<string | number>('config.redis.port') || 6379,
  );
  const source =
    configuredHost && configuredHost !== 'localhost'
      ? configuredHost
      : configuredUrl;
  const parsed = parseRedisSource(source, fallbackPort);
  const tlsEnabled =
    parseBoolean(configService.get('config.redis.tls')) || parsed.tls;

  const options: RedisOptions = {
    host: parsed.host,
    port: parsed.port,
    username:
      configService.get<string>('config.redis.username') || parsed.username,
    password:
      configService.get<string>('config.redis.password') || parsed.password,
    ...overrides,
  };

  if (!options.username) delete options.username;
  if (!options.password) delete options.password;

  if (tlsEnabled) {
    options.tls = { rejectUnauthorized: false };
  }

  return options;
};
