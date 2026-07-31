import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { Permissions } from 'src/modules/auth/decorators/permission.decorator';
import { ModerationDecisionDto } from './dto/moderation-decision.dto';
import { ModerationQueryDto } from './dto/moderation-query.dto';
import { ModerationService } from './moderation.service';

@UseGuards(PermissionsGuard)
@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get()
  @Permissions('report:resolve')
  findAll(@Query() query: ModerationQueryDto) {
    return this.moderationService.findAll(query);
  }

  @Patch(':id/decision')
  @Permissions('report:resolve')
  decide(@Param('id') id: string, @Body() dto: ModerationDecisionDto) {
    return this.moderationService.decide(id, dto);
  }
}
