import { Module } from '@nestjs/common';
import { CacheModule } from 'src/modules/cache/cache.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthSharedModule } from '../shared/auth-shared.module';
import { AuthTwoFactorService } from './auth-two-factor.service';

@Module({
  imports: [PrismaModule, CacheModule, AuthSharedModule],
  providers: [AuthTwoFactorService],
  exports: [AuthTwoFactorService],
})
export class AuthTwoFactorModule {}
