import { MODULE_METADATA } from '@nestjs/common/constants';
import { PostsController } from './posts.controller';
import { PostsModule } from './posts.module';
import { PostsService } from './posts.service';
import { PostCommandService } from './services/post-command.service';
import { PostNotificationService } from './services/post-notification.service';
import { PostPinService } from './services/post-pin.service';
import { PostQueryService } from './services/post-query.service';
import { PostReplyService } from './services/post-reply.service';

const USE_CASE_SERVICES = [
  PostCommandService,
  PostQueryService,
  PostReplyService,
  PostPinService,
];

describe('PostsModule boundaries', () => {
  it('keeps PostsController dependent only on the facade', () => {
    const dependencies = Reflect.getMetadata(
      'design:paramtypes',
      PostsController,
    ) as unknown[];

    expect(dependencies).toEqual([PostsService]);
  });

  it('keeps PostsService focused on use-case orchestration', () => {
    const dependencies = Reflect.getMetadata(
      'design:paramtypes',
      PostsService,
    ) as unknown[];

    expect(dependencies).toEqual(USE_CASE_SERVICES);
  });

  it('registers use-case and supporting services as internal providers', () => {
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      PostsModule,
    ) as unknown[];

    expect(providers).toEqual(
      expect.arrayContaining([
        PostsService,
        ...USE_CASE_SERVICES,
        PostNotificationService,
      ]),
    );
  });

  it('does not expose Posts implementation services', () => {
    const exportedProviders =
      (Reflect.getMetadata(MODULE_METADATA.EXPORTS, PostsModule) as
        | unknown[]
        | undefined) ?? [];

    expect(exportedProviders).toEqual([]);
  });
});
