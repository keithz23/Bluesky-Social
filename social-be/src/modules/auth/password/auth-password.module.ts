import { Module } from '@nestjs/common';
import { CacheModule } from 'src/modules/cache/cache.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthSharedModule } from '../shared/auth-shared.module';
import { AuthPasswordService } from './auth-password.service';

@Module({
  imports: [PrismaModule, CacheModule, AuthSharedModule],
  providers: [AuthPasswordService],
  exports: [AuthPasswordService],
})
export class AuthPasswordModule {}
