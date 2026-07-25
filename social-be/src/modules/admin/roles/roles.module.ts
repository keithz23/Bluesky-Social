import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
<<<<<<< HEAD
import { PermissionsModule } from 'src/modules/permissions/permissions.module';

@Module({
  imports: [PrismaModule, PermissionsModule],
=======

@Module({
  imports: [PrismaModule],
>>>>>>> origin/feat/add-staging
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
