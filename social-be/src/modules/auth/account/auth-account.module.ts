import { Module } from '@nestjs/common';
import { CacheModule } from 'src/modules/cache/cache.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthSharedModule } from '../shared/auth-shared.module';
import { AuthAccountService } from './auth-account.service';

@Module({
  imports: [PrismaModule, CacheModule, AuthSharedModule],
  providers: [AuthAccountService],
  exports: [AuthAccountService],
})
export class AuthAccountModule {}
