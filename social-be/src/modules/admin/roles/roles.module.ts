import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PermissionsModule } from 'src/modules/permissions/permissions.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, PermissionsModule, UsersModule],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
