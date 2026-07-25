import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PermissionsModule } from 'src/modules/permissions/permissions.module';
<<<<<<< HEAD
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PermissionsModule, PrismaModule],
=======

@Module({
  imports: [PermissionsModule],
>>>>>>> origin/feat/add-staging
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
