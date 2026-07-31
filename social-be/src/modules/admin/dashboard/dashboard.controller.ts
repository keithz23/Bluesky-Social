import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { Permissions } from 'src/modules/auth/decorators/permission.decorator';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { DashboardService } from './dashboard.service';

@UseGuards(PermissionsGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @Permissions('system:read')
  getOverview(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getOverview(query);
  }
}
