import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TwoFactorMethod, User } from '@prisma/client';
import { TOTP, NobleCryptoPlugin, ScureBase32Plugin } from 'otplib';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import {
  LOGIN_2FA_TTL_SECONDS,
  RECOVERY_CODE_ALPHABET,
  RECOVERY_CODE_COUNT,
  TOTP_ISSUER,
} from 'src/common/constants/auth-config.constant';
import { HashUtil } from 'src/common/utils/hash.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import {
  Login2FAChallengeData,
  Login2FAChallengeResponse,
} from 'src/common/interfaces/auth.interface';
import { CacheService } from 'src/modules/cache/cache.service';

@Injectable()
export class TwoFactorUtils {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private redisService: CacheService,
  ) {}
  maskEmail(email: string): string {
    const [name, domain] = email.split('@');

    if (!name || !domain) return email;

    const maskedName =
      name.length <= 2
        ? `${name[0]}***`
        : `${name[0]}***${name[name.length - 1]}`;

    const [domainName, ...tldParts] = domain.split('.');
    const tld = tldParts.join('.');

    const maskedDomain =
      domainName.length <= 2
        ? `${domainName[0]}***`
        : `${domainName[0]}***${domainName[domainName.length - 1]}`;

    return tld
      ? `${maskedName}@${maskedDomain}.${tld}`
      : `${maskedName}@${domain}`;
  }

  getTotpSetupKey(userId: string): string {
    return `2fa:totp:setup:${userId}`;
  }

  createTotp(label?: string, secret?: string): TOTP {
    return new TOTP({
      issuer: TOTP_ISSUER,
      label,
      secret,
      period: 30,
      digits: 6,
      algorithm: 'sha1',
      crypto: new NobleCryptoPlugin(),
      base32: new ScureBase32Plugin(),
    });
  }

  normalizeTotpCode(code?: string): string {
    return (code ?? '').trim().replace(/\s/g, '');
  }

  async verifyTotpCode(secret: string, code: string): Promise<boolean> {
    const normalizedCode = this.normalizeTotpCode(code);

    if (!/^\d{6}$/.test(normalizedCode)) return false;

    const result = await this.createTotp(undefined, secret).verify(
      normalizedCode,
      {
        epochTolerance: 30,
      },
    );

    return result.valid;
  }

  async verifyTotpForUser(
    user: Pick<
      User,
      'twoFactorEnabled' | 'twoFactorMethod' | 'twoFactorSecret'
    >,
    code: string,
  ): Promise<boolean> {
    if (
      !user.twoFactorEnabled ||
      user.twoFactorMethod !== TwoFactorMethod.TOTP ||
      !user.twoFactorSecret
    ) {
      return false;
    }

    return this.verifyTotpCode(
      this.decryptSecuritySecret(user.twoFactorSecret),
      code,
    );
  }

  public hasConfiguredTotp(
    user: Pick<
      User,
      'twoFactorEnabled' | 'twoFactorMethod' | 'twoFactorSecret'
    >,
  ): boolean {
    return Boolean(
      user.twoFactorEnabled &&
      user.twoFactorMethod === TwoFactorMethod.TOTP &&
      user.twoFactorSecret,
    );
  }

  public generateRecoveryCodes(count = RECOVERY_CODE_COUNT): string[] {
    return Array.from({ length: count }, () => {
      const characters = Array.from({ length: 12 }, () => {
        const index = crypto.randomInt(0, RECOVERY_CODE_ALPHABET.length);
        return RECOVERY_CODE_ALPHABET[index];
      }).join('');

      return `KNT-${characters.slice(0, 4)}-${characters.slice(4, 8)}-${characters.slice(8)}`;
    });
  }

  public normalizeRecoveryCode(code?: string): string {
    return (code ?? '').trim().toUpperCase().replace(/[\s-]/g, '');
  }

  public async verifyRecoveryCode(
    userId: string,
    code: string,
    consume: boolean,
  ): Promise<boolean> {
    const normalizedCode = this.normalizeRecoveryCode(code);

    if (!normalizedCode) return false;

    const candidates = await this.prisma.recoveryCode.findMany({
      where: {
        userId,
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    for (const candidate of candidates) {
      if (await HashUtil.compare(normalizedCode, candidate.codeHash)) {
        if (consume) {
          await this.prisma.recoveryCode.updateMany({
            where: {
              id: candidate.id,
              usedAt: null,
            },
            data: { usedAt: new Date() },
          });
        }

        return true;
      }
    }

    return false;
  }

  public async verifySecondFactor(
    user: Pick<
      User,
      'id' | 'twoFactorEnabled' | 'twoFactorMethod' | 'twoFactorSecret'
    >,
    code: string,
    options: { consumeRecoveryCode: boolean },
  ): Promise<boolean> {
    if (await this.verifyTotpForUser(user, code)) {
      return true;
    }

    return this.verifyRecoveryCode(user.id, code, options.consumeRecoveryCode);
  }

  public async assertValidPassword(
    user: Pick<User, 'passwordHash'>,
    password: string,
  ): Promise<void> {
    if (!user.passwordHash) {
      throw new BadRequestException(
        'Password verification is required for this action.',
      );
    }

    const isPasswordValid = await HashUtil.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
  }

  public getSecurityEncryptionKey(): Buffer {
    const keyMaterial =
      process.env.TWO_FACTOR_SECRET_KEY ||
      this.configService.get<string>('config.jwt.secret') ||
      this.configService.get<string>('config.jwt.refreshSecret');

    if (!keyMaterial) {
      throw new Error('Missing secret key for two-factor encryption');
    }

    return crypto.createHash('sha256').update(keyMaterial).digest();
  }

  public encryptSecuritySecret(secret: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      this.getSecurityEncryptionKey(),
      iv,
    );
    const encrypted = Buffer.concat([
      cipher.update(secret, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return [
      'v1',
      iv.toString('base64url'),
      authTag.toString('base64url'),
      encrypted.toString('base64url'),
    ].join(':');
  }

  public decryptSecuritySecret(value: string): string {
    if (!value.startsWith('v1:')) return value;

    const [, ivValue, authTagValue, encryptedValue] = value.split(':');

    if (!ivValue || !authTagValue || !encryptedValue) {
      throw new Error('Invalid encrypted two-factor secret');
    }

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.getSecurityEncryptionKey(),
      Buffer.from(ivValue, 'base64url'),
    );

    decipher.setAuthTag(Buffer.from(authTagValue, 'base64url'));

    return Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }

  public async generateQrCodeDataURL(otpAuthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpAuthUrl);
  }

  public async createAndSendLogin2FAChallenge(
    user: Pick<User, 'id' | 'email' | 'username'>,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<Login2FAChallengeResponse> {
    const challengeId = crypto.randomUUID();

    await this.redisService.set(
      this.getLogin2FAChallengeKey(challengeId),
      JSON.stringify({
        userId: user.id,
        attempts: 0,
        createdIp: ipAddress,
        createdUa: userAgent,
      } satisfies Login2FAChallengeData),
      LOGIN_2FA_TTL_SECONDS,
    );

    return {
      requires2FA: true,
      challengeId,
      methods: ['totp', 'recovery_code'],
      maskedEmail: this.maskEmail(user.email),
    };
  }

  public getLogin2FAChallengeKey(challengeId: string): string {
    return `login-2fa:${challengeId}`;
  }
}
