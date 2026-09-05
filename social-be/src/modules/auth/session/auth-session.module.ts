import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthSharedModule } from '../shared/auth-shared.module';
import { AuthSessionService } from './auth-session.service';

@Module({
  imports: [PrismaModule, AuthSharedModule],
  providers: [AuthSessionService],
  exports: [AuthSessionService],
})
export class AuthSessionModule {}
