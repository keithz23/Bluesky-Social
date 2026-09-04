import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './auth.controller';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
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
import { SettingsModule } from '../admin/settings/settings.module';
import { AuthAccountService } from './services/auth-account.service';
import { AuthPasswordService } from './services/auth-password.service';
import { AuthProfileService } from './services/auth-profile.service';
import { AuthSessionService } from './services/auth-session.service';
import { AuthTwoFactorService } from './services/auth-two-factor.service';

@Module({
  imports: [
    MailModule,
    PrismaModule,
    CacheModule,
    UploadModule,
    SettingsModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('config.jwt.secret');
        const expiresIn =
          configService.get<JwtSignOptions['expiresIn']>(
            'config.jwt.expiresIn',
          ) ?? '1h';
        return {
          secret,
          signOptions: { expiresIn },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthAccountService,
    AuthPasswordService,
    AuthProfileService,
    AuthSessionService,
    AuthTwoFactorService,
    JwtStrategy,
    RefreshJwtStrategy,
    GoogleStrategy,
    JwtUtils,
    MailUtils,
    TwoFactorUtils,
    OtherUtils,
  ],
})
export class AuthModule {}
