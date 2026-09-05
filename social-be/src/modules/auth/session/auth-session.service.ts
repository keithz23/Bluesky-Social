import { PrismaService } from 'src/prisma/prisma.service';
import {
  AuthSessionResponseDto,
  CurrentSessionResponseDto,
  GetActiveSessionsResponseDto,
  SuccessResponseDto,
} from '../dto/responses';
import { HashUtil } from 'src/common/utils/hash.util';
import {
  toCurrentUserResponse,
  toRoleResponses,
} from '../mappers/auth-response.mapper';
import { SUCCESS_MESSAGES } from 'src/common/constants/success-message';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { JwtUtils } from '../utils/jwt.util';

@Injectable()
export class AuthSessionService {
  constructor(
    private prisma: PrismaService,
    private jwtUtils: JwtUtils,
  ) {}

  async getCurrentSession(userId: string): Promise<CurrentSessionResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      user: toCurrentUserResponse(user),
      roles: toRoleResponses(user),
    };
  }

  async getActiveSessions(
    userId: string,
  ): Promise<GetActiveSessionsResponseDto[]> {
    const sessions = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions;
  }

  async revokeSession(
    userId: string,
    sessionId: string,
  ): Promise<SuccessResponseDto> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        id: sessionId,
        userId,
      },
    });

    return { message: 'Session revoked successfully' };
  }
  async refreshTokens(refreshToken: string): Promise<AuthSessionResponseDto> {
    // Refresh tokens are bearer credentials: only their digest is retained.
    const tokenDoc = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: HashUtil.hashRefreshToken(refreshToken) },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!tokenDoc) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if expired
    if (new Date() > tokenDoc.expiresAt) {
      await this.prisma.refreshToken.delete({
        where: { id: tokenDoc.id },
      });
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = tokenDoc.user;

    if (user.status !== UserStatus.ACTIVE) {
      await this.prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      });
      throw new UnauthorizedException('Account is not active');
    }

    // Delete old refresh token
    await this.prisma.refreshToken.delete({
      where: { id: tokenDoc.id },
    });

    // Generate new tokens with same device info
    const tokens = await this.jwtUtils.generateTokens(
      user.id,
      user.email,
      user.username,
      user.userRoles.map((ur) => ({
        name: ur.role.name,
        permissions: ur.role.rolePermissions.map((rp) => rp.permission),
      })),
      tokenDoc.userAgent ?? undefined,
      tokenDoc.ipAddress ?? undefined,
    );

    return {
      ...tokens,
      user: toCurrentUserResponse(user),
      roles: toRoleResponses(user),
    };
  }

  async logout(
    userId: string | undefined,
    refreshToken: string,
  ): Promise<SuccessResponseDto> {
    // Delete specific refresh token
    await this.prisma.refreshToken.deleteMany({
      where: {
        ...(userId ? { userId } : {}),
        tokenHash: HashUtil.hashRefreshToken(refreshToken),
      },
    });

    return { message: SUCCESS_MESSAGES.LOGOUT_SUCCESS };
  }

  async logoutAll(userId: string): Promise<SuccessResponseDto> {
    // Delete all refresh tokens for user (logout from all devices)
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return { message: 'Logged out from all devices' };
  }
}
