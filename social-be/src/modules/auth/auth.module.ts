import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshJwtStrategy } from './strategies/jwt-refresh.strategy';
import { MailModule } from 'src/mail/mail.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GoogleStrategy } from './strategies/google.strategy';
import { CacheModule } from '../cache/cache.module';
import { UploadModule } from 'src/uploads/upload.module';
import { JwtUtils } from './utils/jwt.util';
import { MailUtils } from './utils/mail.util';
import { TwoFactorUtils } from './utils/two-factor.util';
import { OtherUtils } from './utils/other.util';

@Module({
  imports: [
    MailModule,
    PrismaModule,
    CacheModule,
    UploadModule,
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get('config.jwt.secret');
        return {
          secret,
          signOptions: {
            expiresIn: configService.get('config.jwt.expiresIn') || '1h',
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RefreshJwtStrategy,
    GoogleStrategy,
    JwtUtils,
    MailUtils,
    JwtUtils,
    TwoFactorUtils,
    OtherUtils,
  ],
})
export class AuthModule {}
