import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { UpdateAuditLogDto } from './dto/update-audit-log.dto';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { Permissions } from 'src/modules/auth/decorators/permission.decorator';

@UseGuards(PermissionsGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Post()
  @Permissions('system:update')
  create(@Body() createAuditLogDto: CreateAuditLogDto) {
    return this.auditLogsService.create(createAuditLogDto);
  }

  @Get()
  @Permissions('system:read')
  findAll(@Query() query: AuditLogQueryDto) {
    return this.auditLogsService.findAll(query);
  }

  @Get(':id')
  @Permissions('system:read')
  findOne(@Param('id') id: string) {
    return this.auditLogsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('system:update')
  update(
    @Param('id') id: string,
    @Body() updateAuditLogDto: UpdateAuditLogDto,
  ) {
    return this.auditLogsService.update(id, updateAuditLogDto);
  }

  @Delete(':id')
  @Permissions('system:update')
  remove(@Param('id') id: string) {
    return this.auditLogsService.remove(id);
  }
}
