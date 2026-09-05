import { Prisma, User } from '@prisma/client';
import { RegisterResponseDto, RoleResponseDto } from '../dto/responses';
export { toCurrentUserResponse } from 'src/modules/users/mappers/user-response.mapper';

export type UserWithRoles = Prisma.UserGetPayload<{
  include: {
    userRoles: {
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true };
            };
          };
        };
      };
    };
  };
}>;

export function toRoleResponses(user: UserWithRoles): RoleResponseDto[] {
  return user.userRoles.map(({ role }) => ({
    id: role.id,
    name: role.name,
    level: role.level,
    permissions: role.rolePermissions.map(({ permission }) => permission.name),
  }));
}

export function toRegisterResponse(user: User): RegisterResponseDto {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    verified: user.verified,
    createdAt: user.createdAt.toISOString(),
  };
}
