import { BadRequestException, Injectable } from '@nestjs/common';
import { addMinutes } from 'date-fns/addMinutes';
import {
  EMAIL_UPDATE_CODE_PREFIX,
  MAX_ACTIVE_EMAIL_CODES,
  PASSWORD_UPDATE_CODE_PREFIX,
  RESET_TTL_MINUTES,
} from 'src/common/constants/auth-config.constant';
import {
  AccountEmailCodeData,
  AccountEmailCodePayload,
  AccountEmailCodePurpose,
} from 'src/common/interfaces/auth.interface';
import { generateResetCode } from 'src/common/utils/generate-reset-code.util';
import { HashUtil } from 'src/common/utils/hash.util';
import { MailService } from 'src/mail/mail.service';
import { CacheService } from 'src/modules/cache/cache.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MailUtils {
  constructor(
    private prisma: PrismaService,
    private redisService: CacheService,
    private mailService: MailService,
  ) {}
  async createAndSendAccountEmailCode({
    user,
    purpose,
    metadata = {},
    userAgent,
    ipAddress,
  }: AccountEmailCodePayload): Promise<void> {
    const rawCode = generateResetCode();
    const codeHash = await HashUtil.hash(rawCode);
    const expiresAt = addMinutes(new Date(), RESET_TTL_MINUTES);

    if (purpose === 'password-reset') {
      const activeCount = await this.prisma.passwordResetToken.count({
        where: {
          userId: user.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (activeCount >= MAX_ACTIVE_EMAIL_CODES) return;

      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: codeHash,
          expiresAt,
          createdIp: ipAddress,
          createdUa: userAgent,
        },
      });
    } else {
      await this.redisService.set(
        this.getAccountEmailCodeKey(purpose, user.id),
        JSON.stringify({
          ...metadata,
          otpHash: codeHash,
          createdIp: ipAddress,
          createdUa: userAgent,
        }),
        RESET_TTL_MINUTES * 60,
      );
    }

    await this.mailService.sendAccountCodeEmail({
      to: user.email,
      code: rawCode,
      username: user.username,
      purpose,
    });
  }

  public getAccountEmailCodeKey(
    purpose: AccountEmailCodePurpose,
    userId: string,
  ): string {
    if (purpose === 'email-update') {
      return `${EMAIL_UPDATE_CODE_PREFIX}:${userId}`;
    }

    if (purpose === 'password-update') {
      return `${PASSWORD_UPDATE_CODE_PREFIX}:${userId}`;
    }

    return `${purpose}:${userId}`;
  }

  async verifyAccountEmailCode<T extends AccountEmailCodeData>(
    purpose: Exclude<AccountEmailCodePurpose, 'password-reset'>,
    userId: string,
    otp: string,
  ): Promise<{ redisKey: string; data: T }> {
    const redisKey = this.getAccountEmailCodeKey(purpose, userId);
    const rawData = await this.redisService.get(redisKey);

    if (!rawData) {
      throw new BadRequestException('OTP is invalid or expired');
    }

    const data = JSON.parse(rawData) as T;
    const normalizedOtp = this.normalizeEmailCode(otp);
    const isValidOtp = data.otpHash
      ? await HashUtil.compare(normalizedOtp, data.otpHash)
      : normalizedOtp === this.normalizeEmailCode(data.otp);

    if (!isValidOtp) {
      throw new BadRequestException('Invalid OTP');
    }

    return { redisKey, data };
  }

  public normalizeEmailCode(code?: string): string {
    const normalized = (code ?? '').trim().toUpperCase().replace(/\s/g, '');

    if (normalized.length === 10 && !normalized.includes('-')) {
      return `${normalized.slice(0, 5)}-${normalized.slice(5)}`;
    }

    return normalized;
  }
}
