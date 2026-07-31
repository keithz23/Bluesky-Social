import { Module } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogsController } from './audit-logs.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PermissionsModule } from 'src/modules/permissions/permissions.module';

@Module({
  imports: [PrismaModule, PermissionsModule],
  controllers: [AuditLogsController],
  providers: [AuditLogsService],
})
export class AuditLogsModule {}
