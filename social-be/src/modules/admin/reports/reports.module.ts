import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PermissionsModule } from 'src/modules/permissions/permissions.module';

@Module({
  imports: [PermissionsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
