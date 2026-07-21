import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from 'src/modules/auth/decorators/permission.decorator';
import { PermissionsService } from 'src/modules/permissions/permissions.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = (request as any).user;

    const userPermissions = await this.permissionService.getUserPermissions(
      user.id,
    );

    const hasPermission = requiredPermissions.every((p) =>
      (userPermissions ?? []).includes(p),
    );

    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission');
    }

    return true;
  }
}
