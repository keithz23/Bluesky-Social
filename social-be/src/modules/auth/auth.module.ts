import { Module } from '@nestjs/common';
import { AuthAccountModule } from './account/auth-account.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthIdentityModule } from './identity/auth-identity.module';
import { AuthPasswordModule } from './password/auth-password.module';
import { AuthSessionModule } from './session/auth-session.module';
import { AuthSharedModule } from './shared/auth-shared.module';
import { GoogleStrategy } from './strategies/google.strategy';
import { RefreshJwtStrategy } from './strategies/jwt-refresh.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthTwoFactorModule } from './two-factor/auth-two-factor.module';

@Module({
  imports: [
    AuthSharedModule,
    AuthIdentityModule,
    AuthSessionModule,
    AuthPasswordModule,
    AuthTwoFactorModule,
    AuthAccountModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshJwtStrategy, GoogleStrategy],
})
export class AuthModule {}
