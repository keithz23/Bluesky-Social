import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
<<<<<<< HEAD
import { RateLimitModule } from 'src/rate-limit/rate-limit.module';
=======
>>>>>>> origin/feat/add-staging

@Module({
  imports: [PrismaModule],
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionsGuard],
  exports: [PermissionsService],
})
export class PermissionsModule {}
