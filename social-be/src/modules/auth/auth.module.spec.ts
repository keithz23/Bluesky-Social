import { MODULE_METADATA } from '@nestjs/common/constants';

jest.mock('otplib', () => ({
  TOTP: class {},
  NobleCryptoPlugin: class {},
  ScureBase32Plugin: class {},
}));

import { AuthAccountModule } from './account/auth-account.module';
import { AuthController } from './auth.controller';
import { AuthAccountService } from './account/auth-account.service';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';
import { AuthIdentityModule } from './identity/auth-identity.module';
import { AuthIdentityService } from './identity/auth-identity.service';
import { AuthPasswordModule } from './password/auth-password.module';
import { AuthPasswordService } from './password/auth-password.service';
import { AuthSessionModule } from './session/auth-session.module';
import { AuthSessionService } from './session/auth-session.service';
import { AuthTwoFactorModule } from './two-factor/auth-two-factor.module';
import { AuthTwoFactorService } from './two-factor/auth-two-factor.service';

const SUBMODULES = [
  {
    name: 'identity',
    module: AuthIdentityModule,
    service: AuthIdentityService,
  },
  { name: 'session', module: AuthSessionModule, service: AuthSessionService },
  {
    name: 'password',
    module: AuthPasswordModule,
    service: AuthPasswordService,
  },
  {
    name: 'two-factor',
    module: AuthTwoFactorModule,
    service: AuthTwoFactorService,
  },
  { name: 'account', module: AuthAccountModule, service: AuthAccountService },
] as const;

const SERVICES = [AuthService, ...SUBMODULES.map(({ service }) => service)];

describe('AuthModule boundaries', () => {
  it('registers only the facade as its auth application service', () => {
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      AuthModule,
    ) as unknown[];

    expect(providers).toContain(AuthService);
    for (const { service } of SUBMODULES) {
      expect(providers).not.toContain(service);
    }
  });

  it('keeps AuthController dependent only on the facade', () => {
    const dependencies = Reflect.getMetadata(
      'design:paramtypes',
      AuthController,
    ) as unknown[];

    expect(dependencies).toEqual([AuthService]);
  });

  it.each(SUBMODULES)(
    '$name module owns and exports only its domain service',
    ({ module, service }) => {
      const providers = Reflect.getMetadata(
        MODULE_METADATA.PROVIDERS,
        module,
      ) as unknown[];
      const exports = Reflect.getMetadata(
        MODULE_METADATA.EXPORTS,
        module,
      ) as unknown[];

      expect(providers).toEqual([service]);
      expect(exports).toEqual([service]);
    },
  );

  it.each(SERVICES.map((service) => ({ name: service.name, service })))(
    '$name exposes valid constructor dependency metadata for Nest DI',
    ({ service }) => {
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
