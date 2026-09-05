import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailUtils } from '../utils/mail.util';
import { ChangePasswordDto, ResetPasswordDto } from '../dto/requests';
import {
  RequestPasswordResetResponseDto,
  SuccessResponseDto,
} from '../dto/responses';
import { HashUtil } from 'src/common/utils/hash.util';
import { CacheService } from 'src/modules/cache/cache.service';
import { PasswordResetToken } from '@prisma/client';

@Injectable()
export class AuthPasswordService {
  constructor(
    private prisma: PrismaService,
    private mailUtils: MailUtils,
    private redisService: CacheService,
  ) {}
  async requestUpdatePassword(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    await this.mailUtils.createAndSendAccountEmailCode({
      user,
      purpose: 'password-update',
      userAgent,
      ipAddress,
    });
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<SuccessResponseDto> {
    const { otp, newPassword } = changePasswordDto;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { redisKey } = await this.mailUtils.verifyAccountEmailCode(
      'password-update',
      userId,
      otp,
    );

    // Hash new password
    const passwordHash = await HashUtil.hash(newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      this.prisma.refreshToken.deleteMany({
        where: { userId },
      }),
    ]);

    await this.redisService.del(redisKey);

    return { message: 'Password changed successfully. Please login again.' };
  }

  async requestPasswordReset(
    email: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<RequestPasswordResetResponseDto> {
    const resetMessage =
      'If an account with this email exists, a password reset link has been sent.';

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        message: resetMessage,
        canResetPassword: true,
      };
    }

    if (user.googleId) {
      return {
        message:
          'This email is registered with Google. Please sign in with Google.',
        canResetPassword: false,
      };
    }

    await this.mailUtils.createAndSendAccountEmailCode({
      user,
      purpose: 'password-reset',
      userAgent,
      ipAddress,
    });

    return {
      message: resetMessage,
      canResetPassword: true,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { newPassword } = resetPasswordDto;
    let { code } = resetPasswordDto;

    code = (code ?? '').trim().toUpperCase().replace(/\s/g, '');
    if (code.length === 10 && !code.includes('-')) {
      code = `${code.slice(0, 5)}-${code.slice(5)}`;
    }

    if (!code) throw new BadRequestException('Invalid or expired token');

    const now = new Date();
    const windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const candidates = await this.prisma.passwordResetToken.findMany({
      where: {
        usedAt: null,
        expiresAt: { gt: now },
        createdAt: { gt: windowStart },
      },
      orderBy: { createdAt: 'desc' },
    });

    let match: PasswordResetToken | null = null;
    for (const c of candidates) {
      if (await HashUtil.compare(code, c.tokenHash)) {
        match = c;
        break;
      }
    }

    if (!match) {
      throw new BadRequestException('Invalid or expired token');
    }

    const passwordHash = await HashUtil.hash(newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: match.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: match.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.passwordResetToken.updateMany({
        where: { userId: match.userId, usedAt: null, id: { not: match.id } },
        data: { usedAt: new Date() },
      }),
    ]);
  }
}
