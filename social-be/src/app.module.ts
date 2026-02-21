import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { MailModule } from './mail/mail.module';
import { CacheModule } from './modules/cache/cache.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validationSchema } from './config/validation.schema';
import appConfig from './config/app.config';
import { AuthModule } from './modules/auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { CustomThrottlerGuard } from './common/guards/throttle.guard';
import { PostsModule } from './modules/posts/posts.module';
import { FeedModule } from './modules/feed/feed.module';
import { FollowsModule } from './modules/follows/follows.module';
import { UsersModule } from './modules/users/users.module';
import { SuggestionsModule } from './modules/suggestions/suggestions.module';
import { LikesModule } from './modules/likes/likes.module';
import { BookmarksModule } from './modules/bookmarks/bookmarks.module';
import { RepostsModule } from './modules/reposts/reposts.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.production'],
      load: [appConfig],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    MailModule,

    // Redis Cache
    CacheModule,

    // Bull Queue (for background jobs)
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('config.redis.host') || 'localhost',
          port: Number(configService.get('config.redis.port') || 6379),
          password: configService.get<string>('config.redis.password'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: {
            age: 3600, // 1 hour
            count: 1000,
          },
          removeOnFail: {
            age: 86400, // 24 hours
          },
        },
      }),
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests
      },
    ]),

    // Scheduled tasks
    ScheduleModule.forRoot(),

    // Common module
    CommonModule,

    //Feature module
    AuthModule,
    PostsModule,
    FeedModule,
    FollowsModule,
    UsersModule,
    SuggestionsModule,
    LikesModule,
    BookmarksModule,
    RepostsModule,
  ],
  providers: [
    // Global guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
