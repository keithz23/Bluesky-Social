import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { Permissions } from 'src/modules/auth/decorators/permission.decorator';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';
import { SettingsService } from './settings.service';

@UseGuards(PermissionsGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Permissions('system:read')
  findAll() {
    return this.settingsService.findAll();
  }

  @Patch()
  @Permissions('system:update')
  update(
    @Body() dto: UpdateSystemSettingsDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.settingsService.update(dto, userId);
  }

  @Delete()
  @Permissions('system:update')
  reset(@CurrentUser('id') userId: string) {
    return this.settingsService.reset(userId);
  }
}
