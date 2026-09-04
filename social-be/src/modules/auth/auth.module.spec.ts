import { MODULE_METADATA } from '@nestjs/common/constants';

jest.mock('otplib', () => ({
  TOTP: class {},
  NobleCryptoPlugin: class {},
  ScureBase32Plugin: class {},
}));

import { AuthModule } from './auth.module';
import { AuthAccountService } from './services/auth-account.service';
import { AuthPasswordService } from './services/auth-password.service';
import { AuthProfileService } from './services/auth-profile.service';
import { AuthService } from './services/auth.service';
import { AuthSessionService } from './services/auth-session.service';
import { AuthTwoFactorService } from './services/auth-two-factor.service';

const AUTH_SERVICES = [
  AuthService,
  AuthAccountService,
  AuthPasswordService,
  AuthProfileService,
  AuthSessionService,
  AuthTwoFactorService,
];

describe('AuthModule', () => {
  it('registers every auth service as a provider', () => {
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      AuthModule,
    ) as unknown[];

    expect(providers).toEqual(expect.arrayContaining(AUTH_SERVICES));
  });

  it.each(AUTH_SERVICES)(
    '%s exposes constructor dependency metadata for Nest DI',
    (service) => {
      const dependencies = Reflect.getMetadata(
        'design:paramtypes',
        service,
      ) as unknown[];

      expect(dependencies).toBeDefined();
      expect(dependencies.length).toBeGreaterThan(0);
      expect(dependencies).not.toContain(undefined);
    },
  );
});
