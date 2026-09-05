import { MODULE_METADATA } from '@nestjs/common/constants';
import { UserProfileService } from './services/user-profile.service';
import { UserSearchService } from './services/user-search.service';
import { UsersController } from './users.controller';
import { UsersModule } from './users.module';
import { UsersService } from './users.service';

describe('UsersModule boundaries', () => {
  it('registers the facade and its internal services', () => {
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      UsersModule,
    ) as unknown[];

    expect(providers).toEqual([
      UsersService,
      UserProfileService,
      UserSearchService,
    ]);
  });

  it('keeps UsersController dependent only on the facade', () => {
    const dependencies = Reflect.getMetadata(
      'design:paramtypes',
      UsersController,
    ) as unknown[];

    expect(dependencies).toEqual([UsersService]);
  });

  it('keeps implementation services private to UsersModule', () => {
    const exportedProviders =
      (Reflect.getMetadata(MODULE_METADATA.EXPORTS, UsersModule) as
        | unknown[]
        | undefined) ?? [];

    expect(exportedProviders).toEqual([]);
  });

  it.each(
    [UsersService, UserProfileService, UserSearchService].map((service) => ({
      name: service.name,
      service,
    })),
  )(
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
