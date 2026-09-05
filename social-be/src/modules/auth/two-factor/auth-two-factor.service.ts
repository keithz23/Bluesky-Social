import { CacheService } from 'src/modules/cache/cache.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtUtils } from '../utils/jwt.util';
import { TwoFactorUtils } from '../utils/two-factor.util';
import { OtherUtils } from '../utils/other.util';
import {
  Disable2FADto,
  Enable2FADto,
  Setup2FADto,
  VerifyLogin2FADto,
} from '../dto/requests';
import {
  AuthSessionResponseDto,
  Enable2FAResponseDto,
  SuccessResponseDto,
} from '../dto/responses';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Login2FAChallengeData,
  TotpSetupData,
} from '../interfaces/auth.interface';
import {
  LOGIN_2FA_TTL_SECONDS,
  MAX_LOGIN_2FA_ATTEMPTS,
  TOTP_ISSUER,
  TOTP_SETUP_TTL_SECONDS,
} from 'src/common/constants/auth-config.constant';
import {
  toCurrentUserResponse,
  toRoleResponses,
} from '../mappers/auth-response.mapper';
import { HashUtil } from 'src/common/utils/hash.util';
import { TwoFactorMethod } from '@prisma/client';

@Injectable()
export class AuthTwoFactorService {
  constructor(
    private prisma: PrismaService,
    private redisService: CacheService,
    private jwtUtils: JwtUtils,
    private twoFactorUtils: TwoFactorUtils,
    private otherUtils: OtherUtils,
  ) {}

  async verifyLogin2FA(
    dto: VerifyLogin2FADto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthSessionResponseDto> {
    const redisKey = this.twoFactorUtils.getLogin2FAChallengeKey(
      dto.challengeId,
    );
    const rawData = await this.redisService.get(redisKey);

    if (!rawData) {
      throw new BadRequestException('2FA challenge is invalid or expired');
    }

    const data = JSON.parse(rawData) as Login2FAChallengeData;

    if (data.attempts >= MAX_LOGIN_2FA_ATTEMPTS) {
      await this.redisService.del(redisKey);
      throw new BadRequestException('Too many invalid attempts');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
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
    });

    if (!user) throw new NotFoundException('User not found');

    this.otherUtils.assertActiveAccount(user);

    if (!user.twoFactorEnabled) {
      await this.redisService.del(redisKey);
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    if (!this.twoFactorUtils.hasConfiguredTotp(user)) {
      await this.redisService.del(redisKey);
      throw new BadRequestException(
        'Two-factor authentication is not configured for authenticator app. Please disable and set it up again.',
      );
    }

    const method = dto.method;
    const isValidSecondFactor =
      method === 'recovery_code'
        ? await this.twoFactorUtils.verifyRecoveryCode(user.id, dto.otp, true)
        : method === 'totp'
          ? await this.twoFactorUtils.verifyTotpForUser(user, dto.otp)
          : await this.twoFactorUtils.verifySecondFactor(user, dto.otp, {
              consumeRecoveryCode: true,
            });

    if (!isValidSecondFactor) {
      await this.redisService.set(
        redisKey,
        JSON.stringify({
          ...data,
          attempts: data.attempts + 1,
        }),
        LOGIN_2FA_TTL_SECONDS,
      );

      throw new BadRequestException('Invalid authenticator or recovery code');
    }

    const tokens = await this.jwtUtils.generateTokens(
      user.id,
      user.email,
      user.username,
      user.userRoles.map((ur) => ({
        name: ur.role.name,
        permissions: ur.role.rolePermissions.map((rp) => rp.permission),
      })),
      userAgent,
      ipAddress,
    );

    await this.redisService.del(redisKey);

    return {
      ...tokens,
      user: toCurrentUserResponse(user),
      roles: toRoleResponses(user),
    };
  }

  async requestEnable2FA(
    userId: string,
    setup2FADto: Setup2FADto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{
    secret: string;
    otpauthUrl: string;
    qrCodeDataUrl: string;
    expiresInSeconds: number;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    this.otherUtils.assertActiveAccount(user);

    if (user.twoFactorEnabled) {
      throw new ConflictException(
        'Two-factor authentication is already enabled.',
      );
    }

    await this.twoFactorUtils.assertValidPassword(user, setup2FADto.password);

    const totp = this.twoFactorUtils.createTotp(user.email);
    const secret = totp.generateSecret();
    const otpauthUrl = totp.toURI({
      issuer: TOTP_ISSUER,
      label: user.email,
      secret,
    });

    await this.redisService.set(
      this.twoFactorUtils.getTotpSetupKey(userId),
      JSON.stringify({
        secret,
        createdIp: ipAddress,
        createdUa: userAgent,
      } satisfies TotpSetupData),
      TOTP_SETUP_TTL_SECONDS,
    );

    return {
      secret,
      otpauthUrl,
      qrCodeDataUrl:
        await this.twoFactorUtils.generateQrCodeDataURL(otpauthUrl),
      expiresInSeconds: TOTP_SETUP_TTL_SECONDS,
    };
  }

  async enable2FA(
    userId: string,
    enabled2FADto: Enable2FADto,
  ): Promise<Enable2FAResponseDto> {
    const { otp } = enabled2FADto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    this.otherUtils.assertActiveAccount(user);

    if (user.twoFactorEnabled) {
      throw new ConflictException(
        'Two-factor authentication is already enabled.',
      );
    }

    const setupKey = this.twoFactorUtils.getTotpSetupKey(userId);
    const rawSetup = await this.redisService.get(setupKey);

    if (!rawSetup) {
      throw new BadRequestException(
        'Two-factor setup is invalid or expired. Please start again.',
      );
    }

    const setup = JSON.parse(rawSetup) as TotpSetupData;
    const isValidTotp = await this.twoFactorUtils.verifyTotpCode(
      setup.secret,
      otp,
    );

    if (!isValidTotp) {
      throw new BadRequestException('Invalid authenticator code');
    }

    const recoveryCodes = this.twoFactorUtils.generateRecoveryCodes();
    const recoveryCodeRows = await Promise.all(
      recoveryCodes.map(async (code) => ({
        userId,
        codeHash: await HashUtil.hash(
          this.twoFactorUtils.normalizeRecoveryCode(code),
        ),
      })),
    );

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: true,
          twoFactorEnabledAt: new Date(),
          twoFactorMethod: TwoFactorMethod.TOTP,
          twoFactorSecret: this.twoFactorUtils.encryptSecuritySecret(
            setup.secret,
          ),
        },
      }),
      this.prisma.recoveryCode.deleteMany({
        where: { userId },
      }),
      this.prisma.recoveryCode.createMany({
        data: recoveryCodeRows,
      }),
    ]);

    await this.redisService.del(setupKey);

    return {
      message: 'Two-factor authentication enabled successfully.',
      recoveryCodes,
    };
  }

  async requestDisable2FA(userId: string): Promise<SuccessResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');
    this.otherUtils.assertActiveAccount(user);

    if (!user.twoFactorEnabled) {
      throw new ConflictException('Two-factor authentication is not enabled.');
    }

    return {
      message:
        'Verify your password and authenticator code to disable two-factor authentication.',
    };
  }

  async disable2FA(
    userId: string,
    disable2FADto: Disable2FADto,
  ): Promise<SuccessResponseDto> {
    const { otp, password } = disable2FADto;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    this.otherUtils.assertActiveAccount(user);

    if (!user.twoFactorEnabled) {
      throw new ConflictException('Two-factor authentication is not enabled.');
    }

    await this.twoFactorUtils.assertValidPassword(user, password);

    const isValidSecondFactor = await this.twoFactorUtils.verifySecondFactor(
      user,
      otp,
      {
        consumeRecoveryCode: true,
      },
    );

    if (!isValidSecondFactor) {
      throw new BadRequestException('Invalid authenticator or recovery code');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: false,
          twoFactorMethod: null,
          twoFactorEnabledAt: null,
          twoFactorSecret: null,
        },
      }),
      this.prisma.recoveryCode.deleteMany({
        where: { userId },
      }),
      this.prisma.appPassword.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: 'Two-factor authentication disabled successfully' };
  }
}
