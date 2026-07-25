import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Put,
<<<<<<< HEAD
  UseGuards,
=======
>>>>>>> origin/feat/add-staging
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
<<<<<<< HEAD
import { DeleteRoleDto } from './dto/delete-role.dto';
import { SyncPermissionsDto } from './dto/sync-permissions.dto';
import { Permissions } from 'src/modules/auth/decorators/permission.decorator';
import { RoleQueryDto } from './dto/role-query.dto';
import { assignPermissionsDto } from './dto/assign-permissions.dto';
import { PermissionsGuard } from 'src/common/guards/permission.guard';

@UseGuards(PermissionsGuard)
=======
import { RoleQueryDto } from './dto/role-query,dto';
import { DeleteRoleDto } from './dto/delete-role.dto';
import { assignPermissionsDto } from './dto/assign-permissions.dto';
import { SyncPermissionsDto } from './dto/sync-permissions.dto';

>>>>>>> origin/feat/add-staging
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
<<<<<<< HEAD
  @Permissions('role:create')
=======
>>>>>>> origin/feat/add-staging
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
<<<<<<< HEAD
  @Permissions('role:read')
=======
>>>>>>> origin/feat/add-staging
  findAll(@Query() query: RoleQueryDto) {
    return this.rolesService.findAll(query);
  }

  // Permission Group
  @Get('permissions')
<<<<<<< HEAD
  @Permissions('permission:read')
=======
>>>>>>> origin/feat/add-staging
  findAllPermissionGroup() {
    return this.rolesService.findAllGroupPermissions();
  }

  @Get(':roleId')
<<<<<<< HEAD
  @Permissions('role:read')
=======
>>>>>>> origin/feat/add-staging
  findOne(@Param('roleId') roleId: string) {
    return this.rolesService.findOne(roleId);
  }

  @Patch(':roleId')
<<<<<<< HEAD
  @Permissions('role:update')
=======
>>>>>>> origin/feat/add-staging
  update(
    @Param('roleId') roleId: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(roleId, updateRoleDto);
  }

  @Delete()
<<<<<<< HEAD
  @Permissions('role:delete')
=======
>>>>>>> origin/feat/add-staging
  delete(@Body() deleteRoleDto: DeleteRoleDto) {
    return this.rolesService.delete(deleteRoleDto);
  }

  // Assign permissions
  @Post(':roleId/permissions')
<<<<<<< HEAD
  @Permissions('role:assign-permission')
=======
>>>>>>> origin/feat/add-staging
  assignPermissions(
    @Param('roleId') roleId: string,
    @Body() assignPermissionsDto: assignPermissionsDto,
  ) {
    return this.rolesService.assignPermissions(
      roleId,
      assignPermissionsDto.permissionIds,
    );
  }

  @Put(':roleId/permissions')
<<<<<<< HEAD
  @Permissions('role:assign-permission')
=======
>>>>>>> origin/feat/add-staging
  syncPermissions(
    @Param('roleId') roleId: string,
    @Body() syncPermissionsDto: SyncPermissionsDto,
  ) {
    return this.rolesService.syncPermissions(
      roleId,
      syncPermissionsDto.permissionIds,
    );
  }

  // Revoke permission
  @Delete(':roleId/permissions/:permissionId')
<<<<<<< HEAD
  @Permissions('role:assign-permission')
=======
>>>>>>> origin/feat/add-staging
  revokePermission(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rolesService.revokePermission(roleId, permissionId);
  }
}
