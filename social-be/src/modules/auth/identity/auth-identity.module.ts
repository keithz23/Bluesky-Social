import { Module } from '@nestjs/common';
import { MailModule } from 'src/mail/mail.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UploadModule } from 'src/uploads/upload.module';
import { SettingsModule } from '../../admin/settings/settings.module';
import { AuthSharedModule } from '../shared/auth-shared.module';
import { AuthIdentityService } from './auth-identity.service';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    UploadModule,
    SettingsModule,
    AuthSharedModule,
  ],
  providers: [AuthIdentityService],
  exports: [AuthIdentityService],
})
export class AuthIdentityModule {}
