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
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/requests/create-role.dto';
import { UpdateRoleDto } from './dto/requests/update-role.dto';
import { DeleteRoleDto } from './dto/requests/delete-role.dto';
import { SyncPermissionsDto } from './dto/requests/sync-permissions.dto';
import { Permissions } from 'src/modules/auth/decorators/permission.decorator';
import { RoleQueryDto } from './dto/requests/role-query.dto';
import { assignPermissionsDto } from './dto/requests/assign-permissions.dto';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@UseGuards(PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Permissions('role:create')
  create(
    @CurrentUser('id') userId: string,
    @Body() createRoleDto: CreateRoleDto,
  ) {
    return this.rolesService.create(userId, createRoleDto);
  }

  @Get()
  @Permissions('role:read')
  findAll(@Query() query: RoleQueryDto) {
    return this.rolesService.findAll(query);
  }

  // Permission Group
  @Get('permissions')
  @Permissions('permission:read')
  findAllPermissionGroup() {
    return this.rolesService.findAllGroupPermissions();
  }

  @Get(':roleId')
  @Permissions('role:read')
  findOne(@Param('roleId') roleId: string) {
    return this.rolesService.findOne(roleId);
  }

  @Patch(':roleId')
  @Permissions('role:update')
  update(
    @CurrentUser('id') userId: string,
    @Param('roleId') roleId: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(userId, roleId, updateRoleDto);
  }

  @Delete()
  @Permissions('role:delete')
  delete(
    @CurrentUser('id') userId: string,
    @Body() deleteRoleDto: DeleteRoleDto,
  ) {
    return this.rolesService.delete(userId, deleteRoleDto);
  }

  // Assign permissions
  @Post(':roleId/permissions')
  @Permissions('role:assign-permission')
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
  @Permissions('role:assign-permission')
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
  @Permissions('role:assign-permission')
  revokePermission(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rolesService.revokePermission(roleId, permissionId);
  }
}
