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
import { Public } from 'src/common/decorators/public.decorator';
import { RulesService } from './rules.service';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { RuleQueryDto } from './dto/rule-query.dto';
import { DeleteRuleDto } from './dto/delete-rule.dto';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { Permissions } from 'src/modules/auth/decorators/permission.decorator';
import { ActiveRuleResponse, RulesResponse } from './rules.interface';

@Controller('rules')
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Get('active')
  @Public()
  findActiveRulesForReport(): Promise<ActiveRuleResponse[]> {
    return this.rulesService.findActiveRulesForReport();
  }

  @UseGuards(PermissionsGuard)
  @Post()
  @Permissions('rule:create')
  create(@Body() createRuleDto: CreateRuleDto): Promise<RulesResponse> {
    return this.rulesService.create(createRuleDto);
  }

  @UseGuards(PermissionsGuard)
  @Get()
  @Permissions('rule:read')
  findAll(@Query() query: RuleQueryDto) {
    return this.rulesService.findAll(query);
  }

  @UseGuards(PermissionsGuard)
  @Get(':ruleId')
  @Permissions('rule:read')
  findOne(@Param('ruleId') ruleId: string) {
    return this.rulesService.findOne(ruleId);
  }

  @UseGuards(PermissionsGuard)
  @Patch(':ruleId')
  @Permissions('rule:update')
  update(
    @Param('ruleId') ruleId: string,
    @Body() updateRuleDto: UpdateRuleDto,
  ) {
    return this.rulesService.update(ruleId, updateRuleDto);
  }

  @UseGuards(PermissionsGuard)
  @Delete()
  @Permissions('rule:delete')
  delete(@Body() deleteRuleDto: DeleteRuleDto) {
    return this.rulesService.delete(deleteRuleDto);
  }
}
