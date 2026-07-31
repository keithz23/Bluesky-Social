import { Module } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { ModerationController } from './moderation.controller';
import { PermissionsModule } from 'src/modules/permissions/permissions.module';

@Module({
  imports: [PermissionsModule],
  controllers: [ModerationController],
  providers: [ModerationService],
})
export class ModerationModule {}
