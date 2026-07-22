import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleQueryDto } from './dto/role-query,dto';
import { DeleteRoleDto } from './dto/delete-role.dto';
import { assignPermissionsDto } from './dto/assign-permissions.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  findAll(@Query() query: RoleQueryDto) {
    return this.rolesService.findAll(query);
  }

  @Get(':roleId')
  findOne(@Param('roleId') roleId: string) {
    return this.rolesService.findOne(roleId);
  }

  @Patch(':roleId')
  update(
    @Param('roleId') roleId: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(roleId, updateRoleDto);
  }

  @Delete()
  delete(@Body() deleteRoleDto: DeleteRoleDto) {
    return this.rolesService.delete(deleteRoleDto);
  }

  // Assign permissions
  @Post(':roleId/permissions')
  assignPermissions(
    @Param('roleId') roleId: string,
    @Body() assignPermissionsDto: assignPermissionsDto,
  ) {
    return this.rolesService.assignPermissions(
      roleId,
      assignPermissionsDto.permissionIds,
    );
  }

  // Revoke permission
  @Delete(':roleId/permissions/:permissionId')
  revokePermission(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rolesService.revokePermission(roleId, permissionId);
  }
}
