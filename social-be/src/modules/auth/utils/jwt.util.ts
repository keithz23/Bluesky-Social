import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

interface RoleWithPermissions {
  name: string;
  permissions: { name: string }[];
}

@Injectable()
export class JwtUtils {
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async generateTokens(
    userId: string,
    email: string,
    username: string,
    roles: RoleWithPermissions[],
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const roleNames = roles.map((role) => role.name);
    const permissions = Array.from(
      new Set(roles.flatMap((role) => role.permissions.map((p) => p.name))),
    );

    const accessPayload = {
      sub: userId,
      email,
      username,
      roles: roleNames,
      permissions,
    };

    // refresh token nên gọn nhất có thể, không cần permissions
    const refreshPayload = {
      sub: userId,
    };

    const jwtSecret = this.configService.get<string>('config.jwt.secret') || '';
    const refreshSecret =
      this.configService.get<string>('config.jwt.refreshSecret') || jwtSecret;
    const refreshExpiresIn =
      this.configService.get('config.jwt.refreshExpiresIn', '7d') ?? '7d';

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: jwtSecret,
      expiresIn: this.configService.get('config.jwt.expiresIn', '15m'),
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    });

    const expiresAt = new Date(
      Date.now() + this.durationToMilliseconds(refreshExpiresIn),
    );

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
        userAgent,
        ipAddress,
      },
    });

    return { accessToken, refreshToken };
  }

  private durationToMilliseconds(value: string | number): number {
    if (typeof value === 'number') {
      return value * 1000;
    }

    const match = value.trim().match(/^(\d+)(ms|s|m|h|d)$/);
    if (!match) {
      return 7 * 24 * 60 * 60 * 1000;
    }

    const amount = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      ms: 1,
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return amount * multipliers[unit];
  }
}
