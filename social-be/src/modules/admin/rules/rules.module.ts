import { Module } from '@nestjs/common';
import { RulesService } from './rules.service';
import { RulesController } from './rules.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PermissionsModule } from 'src/modules/permissions/permissions.module';

@Module({
  imports: [PrismaModule, PermissionsModule],
  controllers: [RulesController],
  providers: [RulesService],
})
export class RulesModule {}
