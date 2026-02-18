import { registerAs } from '@nestjs/config';

export default registerAs('config', () => ({
  port: parseInt(process.env.PORT ?? '', 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.POSTGRES_URL,
  },

  aws: {
    accessKey: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    bucket: process.env.AWS_BUCKET_NAME,
    endpoint: process.env.AWS_ENDPOINT,
  },

  cloudfront: {
    domain: process.env.CLOUDFRONT_DOMAIN,
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6380,
    url: process.env.REDIS_URL || 'redis://localhost:6380',
  },

  ttl: {
    accessToken: '15m',
    refreshToken: '30d',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'this-my-super-jwt-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  api: {
    prefix: process.env.API_PREFIX || 'api/v1',
  },

  swagger: {
    title: process.env.SWAGGER_TITLE || 'NestJS API',
    description: process.env.SWAGGER_DESCRIPTION || 'API Documentation',
    version: process.env.SWAGGER_VERSION || '1.0',
  },

  mail: {
    host: process.env.MAIL_HOST || '',
    port: process.env.MAIL_PORT || '',
    user: process.env.MAIL_USER || '',
    from: process.env.MAIL_FROM || '',
    secure: process.env.MAIL_SECURE || '',
    password: process.env.MAIL_PASSWORD || '',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },

  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '', 10) || 12,
  },

  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '', 10) || 60,
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '', 10) || 10,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || ['http://localhost:5173'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  client: {
    url: process.env.CLIENT_URL || 'http://localhost:5173',
  },

  server: {
    url: process.env.SERVER_URL || 'http://localhost:3000',
  },
}));
