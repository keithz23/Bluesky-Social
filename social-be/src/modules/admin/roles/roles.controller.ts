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
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { DeleteRoleDto } from './dto/delete-role.dto';
import { SyncPermissionsDto } from './dto/sync-permissions.dto';
import { Permissions } from 'src/modules/auth/decorators/permission.decorator';
import { RoleQueryDto } from './dto/role-query.dto';
import { assignPermissionsDto } from './dto/assign-permissions.dto';
import { PermissionsGuard } from 'src/common/guards/permission.guard';

@UseGuards(PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Permissions('role:create')
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
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
    @Param('roleId') roleId: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(roleId, updateRoleDto);
  }

  @Delete()
  @Permissions('role:delete')
  delete(@Body() deleteRoleDto: DeleteRoleDto) {
    return this.rolesService.delete(deleteRoleDto);
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
