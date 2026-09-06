import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { MailModule } from 'src/mail/mail.module';
import { CacheModule } from 'src/modules/cache/cache.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtUtils } from '../utils/jwt.util';
import { MailUtils } from '../utils/mail.util';
import { OtherUtils } from '../utils/other.util';
import { TwoFactorUtils } from '../utils/two-factor.util';

@Module({
  imports: [
    PrismaModule,
    CacheModule,
    MailModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('config.jwt.secret');
        const expiresIn =
          configService.get<JwtSignOptions['expiresIn']>(
            'config.jwt.expiresIn',
          ) ?? '1h';

        return { secret, signOptions: { expiresIn } };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [JwtUtils, MailUtils, TwoFactorUtils, OtherUtils],
  exports: [JwtModule, JwtUtils, MailUtils, TwoFactorUtils, OtherUtils],
})
export class AuthSharedModule {}
