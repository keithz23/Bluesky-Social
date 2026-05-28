import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from 'src/common/decorators/public.decorator';
import { MonitoringService } from './monitoring.service';

@ApiTags('Monitoring')
@Public()
@Controller()
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('health/live')
  @ApiOperation({ summary: 'Liveness check for process uptime' })
  live() {
    return this.monitoringService.live();
  }

  @Get('health/ready')
  @ApiOperation({ summary: 'Readiness check for database and queues' })
  async ready(@Res({ passthrough: true }) response: Response) {
    const result = await this.monitoringService.ready();
    if (result.status !== 'ok') response.status(HttpStatus.SERVICE_UNAVAILABLE);
    return result;
  }

  @Get('health')
  @ApiOperation({ summary: 'Full application health summary' })
  async health(@Res({ passthrough: true }) response: Response) {
    const result = await this.monitoringService.health();
    if (result.status !== 'ok') response.status(HttpStatus.SERVICE_UNAVAILABLE);
    return result;
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Prometheus-compatible runtime metrics' })
  metrics(@Res() response: Response) {
    response
      .type('text/plain; version=0.0.4; charset=utf-8')
      .send(this.monitoringService.metricsText());
  }
}
