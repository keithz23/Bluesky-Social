import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { addMinutes } from 'date-fns';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { HashUtil } from '../../common/utils/hash.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { SUCCESS_MESSAGES } from 'src/common/constants/success-message';
import { ERROR_MESSAGES } from 'src/common/constants/error-message';
import { MailService } from 'src/mail/mail.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordResetToken, Prisma, User, UserStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { generateResetCode } from 'src/common/utils/generate-reset-code.util';
import { S3Service } from 'src/uploads/s3.service';
import {
  CleanupJobData,
  JOB_NAMES,
  QUEUE_NAMES,
} from 'src/common/constants/queue.constant';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { UpdateEmailDto } from './dto/update-email.dto';
import { CacheService } from '../cache/cache.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeUsernameDto } from './dto/change-username.dto';
import { ChangeDateOfBirthDto } from './dto/change-dob.dto';
import { DeactivateAccountDto } from './dto/deactivate-account-dto';

const RESET_TTL_MINUTES = 15;
const MAX_ACTIVE_EMAIL_CODES = 3;
const EMAIL_UPDATE_CODE_PREFIX = 'email_update';
const PASSWORD_UPDATE_CODE_PREFIX = 'password_update';

type AccountEmailCodePurpose =
  | 'password-reset'
  | 'email-update'
  | 'password-update'
  | 'deactivate-account';

type AccountEmailCodePayload = {
  user: Pick<User, 'id' | 'email' | 'username'>;
  purpose: AccountEmailCodePurpose;
  metadata?: Record<string, unknown>;
  userAgent?: string;
  ipAddress?: string;
};

type AuditContext = {
  userAgent?: string;
  ipAddress?: string;
};

type AccountEmailCodeData = {
  otpHash?: string;
  otp?: string;
};

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
    private s3Service: S3Service,
    private redisService: CacheService,
    @InjectQueue(QUEUE_NAMES.CLEANUP)
    private cleanupQueue: Queue<CleanupJobData>,
  ) { }

  async register(registerDto: RegisterDto): Promise<User> {
    const { email, username, password, dateOfBirth } = registerDto;

    // Check if email exists
    const existingEmail = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      throw new ConflictException(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    // Check if username exists
    const existingUsername = await this.prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      throw new ConflictException(ERROR_MESSAGES.USERNAME_ALREADY_EXISTS);
    }

    // Hash password
    const passwordHash = await HashUtil.hash(password);

    const newUser = await this.prisma.$transaction(async (prisma) => {
      const user = await prisma.user.create({
        data: {
          email,
          username,
          passwordHash,
          dateOfBirth,
          displayName: username,
        },
      });

      const verifyToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await prisma.emailVerificationToken.create({
        data: {
          token: verifyToken,
          userId: user.id,
          expiresAt: expiresAt,
        },
      });
      await this.mailService.sendVerifyEmail(
        user.email,
        verifyToken,
        user.username,
      );

      return user;
    });

    return newUser;
  }

  async login(
    loginDto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const { account, password } = loginDto;

    // Find user by email or username
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: account }, { username: account }],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await HashUtil.compare(
      password,
      user.passwordHash ?? '',
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.assertActiveAccount(user);

    // Generate tokens with device info
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      userAgent,
      ipAddress,
    );

    // Update last activity
    await this.prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() },
    });

    return {
      ...tokens,
      user: this.transformUser(user),
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponseDto> {
    // Verify refresh token in database
    const tokenDoc = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
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
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      tokenDoc.userAgent ?? undefined,
      tokenDoc.ipAddress ?? undefined,
    );

    return {
      ...tokens,
      user: this.transformUser(user),
    };
  }

  async logout(
    userId: string | undefined,
    refreshToken: string,
  ): Promise<{ message: string }> {
    // Delete specific refresh token
    await this.prisma.refreshToken.deleteMany({
      where: {
        ...(userId ? { userId } : {}),
        token: refreshToken,
      },
    });

    return { message: SUCCESS_MESSAGES.LOGOUT_SUCCESS };
  }

  async logoutAll(userId: string): Promise<{ message: string }> {
    // Delete all refresh tokens for user (logout from all devices)
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return { message: 'Logged out from all devices' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.transformUser(user);
  }

  async updateProfile(
    userId: string,
    updateDto: UpdateProfileDto,
    avatar?: Express.Multer.File[],
    cover?: Express.Multer.File[],
  ) {
    const uploadedKeys: string[] = [];

    try {
      // Upload avatar
      if (avatar?.length) {
        const results = await this.s3Service
          .uploadImages(avatar, `public/avatar/${userId}`, {
            resize: true,
            quality: 85,
          })
          .catch((error) => {
            this.logger.error('Error uploading avatar', error);
            throw new BadRequestException('Failed to upload avatar');
          });

        uploadedKeys.push(...results.map((r) => r.key));
        updateDto.avatarUrl = results[0].url;
      }

      // Upload cover
      if (cover?.length) {
        const results = await this.s3Service
          .uploadImages(cover, `public/cover/${userId}`, {
            resize: true,
            quality: 85,
          })
          .catch((error) => {
            this.logger.error('Error uploading cover', error);
            throw new BadRequestException('Failed to upload cover');
          });

        uploadedKeys.push(...results.map((r) => r.key));
        updateDto.coverUrl = results[0].url;
      }

      // Get old image before update to delete later
      const oldUser = uploadedKeys.length
        ? await this.prisma.user.findUnique({
          where: { id: userId },
          select: { avatarUrl: true, coverUrl: true },
        })
        : null;

      const user = await this.prisma.user.update({
        where: { id: userId },
        data: updateDto,
      });

      // Deleted old image after update db
      if (oldUser) {
        const oldKeys = [
          updateDto.avatarUrl && oldUser.avatarUrl
            ? this.s3Service.extractKeyFromUrl(oldUser.avatarUrl)
            : null,
          updateDto.coverUrl && oldUser.coverUrl
            ? this.s3Service.extractKeyFromUrl(oldUser.coverUrl)
            : null,
        ].filter(Boolean);

        if (oldKeys.length) {
          this.scheduleCleanup(
            oldKeys as string[],
            'replaced_by_new_upload',
          ).catch((err) =>
            this.logger.warn('Failed to schedule old image cleanup', err),
          );
        }
      }

      return this.transformUser(user);
    } catch (error) {
      if (uploadedKeys.length) {
        await this.scheduleCleanup(uploadedKeys, 'transaction_failed');
        this.logger.warn(
          `Scheduled cleanup for ${uploadedKeys.length} orphaned files`,
        );
      }
      throw error;
    }
  }

  async changeUsername(
    userId: string,
    changeUsernameDto: ChangeUsernameDto,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const { username } = changeUsernameDto;
    const normalizedUsername = username.trim();

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) throw new NotFoundException('User not found');

    const existing = await this.prisma.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (existing && existing.id != userId) {
      throw new ConflictException('Username already exists.');
    }

    const [user] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { username: normalizedUsername, displayName: normalizedUsername },
      }),
      this.prisma.auditLog.create({
        data: this.createAuditLogData({
          userId,
          action: 'ACCOUNT_USERNAME_CHANGED',
          userAgent,
          ipAddress,
          metadata: {
            oldUsername: currentUser.username,
            newUsername: normalizedUsername,
          },
        }),
      }),
    ]);

    return this.transformUser(user);
  }

  async changeBirthday(
    userId: string,
    changeDateOfBirthDto: ChangeDateOfBirthDto,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const { dateOfBirth } = changeDateOfBirthDto;
    const birthDate = new Date(dateOfBirth);

    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 13);

    if (birthDate > minDate) {
      throw new BadRequestException('You must be at least 13 years old.');
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) throw new NotFoundException('User not found');

    const [user] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { dateOfBirth: birthDate },
      }),
      this.prisma.auditLog.create({
        data: this.createAuditLogData({
          userId,
          action: 'ACCOUNT_BIRTHDAY_CHANGED',
          userAgent,
          ipAddress,
          metadata: {
            oldDateOfBirth: this.formatAuditDate(currentUser.dateOfBirth),
            newDateOfBirth: this.formatAuditDate(birthDate),
          },
        }),
      }),
    ]);

    return this.transformUser(user);
  }

  async requestUpdatePassword(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    await this.createAndSendAccountEmailCode({
      user,
      purpose: 'password-update',
      userAgent,
      ipAddress,
    });
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ message: string }> {
    const { otp, newPassword } = changePasswordDto;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { redisKey } = await this.verifyAccountEmailCode(
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
      this.prisma.auditLog.create({
        data: this.createAuditLogData({
          userId,
          action: 'ACCOUNT_PASSWORD_CHANGED',
          userAgent,
          ipAddress,
          metadata: {
            method: 'email_otp',
            refreshTokensRevoked: true,
          },
        }),
      }),
    ]);

    await this.redisService.del(redisKey);

    return { message: 'Password changed successfully. Please login again.' };
  }

  async requestPasswordReset(
    email: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ message: string; canResetPassword: boolean }> {
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
        message: "This email is registered with Google. Please sign in with Google.",
        canResetPassword: false,
      };
    }

    await this.createAndSendAccountEmailCode({
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

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
    userAgent?: string,
    ipAddress?: string,
  ) {
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
      this.prisma.auditLog.create({
        data: this.createAuditLogData({
          userId: match.userId,
          action: 'ACCOUNT_PASSWORD_RESET',
          userAgent,
          ipAddress,
          metadata: {
            method: 'forgot_password_code',
            resetTokenId: match.id,
          },
        }),
      }),
    ]);
  }

  async checkUsername(username: string): Promise<{ available: boolean }> {
    const existing = await this.prisma.user.findUnique({
      where: { username },
    });

    return { available: !existing };
  }

  async checkEmail(email: string): Promise<{ available: boolean }> {
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    return { available: !existing };
  }

  async verifyEmail(token: string) {
    const existingToken = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!existingToken) {
      throw new NotFoundException(
        'Invalid or non-existent verification token.',
      );
    }

    const now = new Date();
    if (existingToken.expiresAt < now) {
      await this.prisma.emailVerificationToken.delete({
        where: { id: existingToken.id },
      });

      throw new BadRequestException(
        'The verification link has expired. Please request a new verification email.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: existingToken.userId },
    });

    if (!user) {
      throw new BadRequestException('User does not exist.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          verified: true,
          // emailVerifiedAt: new Date()
        },
      });

      await tx.emailVerificationToken.deleteMany({
        where: { userId: user.id },
      });
    });

    return {
      message: 'Email verification successful. You can now log in.',
    };
  }

  async getActiveSessions(userId: string) {
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
  ): Promise<{ message: string }> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        id: sessionId,
        userId,
      },
    });

    return { message: 'Session revoked successfully' };
  }

  async validateUser(identifier: string, password: string): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await HashUtil.compare(
      password,
      user.passwordHash ?? '',
    );

    if (!isPasswordValid) {
      return null;
    }

    if (user.status !== UserStatus.ACTIVE) {
      return null;
    }

    return this.transformUser(user);
  }

  async googleLogin(googleUser: any, ipAddress: string, userAgent: string) {
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: googleUser.email }],
      },
    });

    if (user && user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    if (user && !user.googleId) {
      await this.mailService.sendEmailNotification(
        user.email,
        user.username,
        user.email,
      );

      throw new ConflictException({
        message:
          'This email is already registered with a password. Please sign in using your password.',
        code: 'EMAIL_ALREADY_EXISTS',
        email: user.email,
      });
    }

    if (user && user.googleId) {
      if (!user.avatarUrl && googleUser.picture) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl: googleUser.picture },
        });
      }

      const tokens = await this.generateTokens(
        user.id,
        user.email,
        userAgent,
        ipAddress,
      );

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    }

    const baseUsername = googleUser.email.split('@')[0];
    let username = baseUsername;
    let counter = 1;

    while (await this.prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    user = await this.prisma.user.create({
      data: {
        email: googleUser.email,
        username: username,
        googleId: googleUser.googleId,
        avatarUrl: googleUser.picture,
        verified: true,
        displayName: username,
      },
    });

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      userAgent,
      ipAddress,
    );

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async requestUpdateEmail(
    userId: string,
    newEmail: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new NotFoundException('User not found');

    const normalizedEmail = newEmail.trim().toLowerCase();

    if (normalizedEmail == user.email)
      throw new ConflictException(
        'This email is already associated with your account.',
      );

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists.');
    }

    await this.createAndSendAccountEmailCode({
      user,
      purpose: 'email-update',
      metadata: { new_email: normalizedEmail },
      userAgent,
      ipAddress,
    });
  }

  async updateEmail(
    updateEmailDto: UpdateEmailDto,
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const { otp } = updateEmailDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    const { redisKey, data: requestUpdateEmailData } =
      await this.verifyAccountEmailCode<
        AccountEmailCodeData & { new_email: string }
      >('email-update', userId, otp);

    const existingUser = await this.prisma.user.findUnique({
      where: { email: requestUpdateEmailData.new_email },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException('Email already exists');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { email: requestUpdateEmailData.new_email },
      }),
      this.prisma.refreshToken.deleteMany({
        where: { userId },
      }),
      this.prisma.auditLog.create({
        data: this.createAuditLogData({
          userId,
          action: 'ACCOUNT_EMAIL_CHANGED',
          userAgent,
          ipAddress,
          metadata: {
            oldEmail: user.email,
            newEmail: requestUpdateEmailData.new_email,
            refreshTokensRevoked: true,
          },
        }),
      }),
    ]);

    await this.redisService.del(redisKey);

    return { message: 'Email updated successfully. Please login again.' };
  }

  async requestDeactivateAccount(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');
    this.assertActiveAccount(user);

    await this.createAndSendAccountEmailCode({
      user,
      purpose: 'deactivate-account',
      userAgent,
      ipAddress,
    });
  }

  async deactivateAccount(
    userId: string,
    deactivateAccountDto: DeactivateAccountDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ message: string }> {
    const { otp } = deactivateAccountDto;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');
    this.assertActiveAccount(user);

    const { redisKey } = await this.verifyAccountEmailCode(
      'deactivate-account',
      userId,
      otp,
    );

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          status: UserStatus.DEACTIVATED,
          deactivatedAt: new Date(),
        },
      }),
      this.prisma.refreshToken.deleteMany({
        where: { userId },
      }),
      this.prisma.auditLog.create({
        data: this.createAuditLogData({
          userId,
          action: 'DEACTIVATE_ACCOUNT',
          userAgent,
          ipAddress,
          metadata: {
            status: 'DEACTIVATED',
            refreshTokensRevoked: true,
          },
        }),
      }),
    ]);

    await this.redisService.del(redisKey);

    return { message: 'Account deactivated successfully.' };
  }

  private async generateTokens(
    userId: string,
    email: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: userId,
      email,
    };

    const jwtSecret = this.configService.get<string>('config.jwt.secret') || '';
    const refreshSecret =
      this.configService.get<string>('config.jwt.refreshSecret') || jwtSecret;

    const accessToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: this.configService.get('config.jwt.expiresIn', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: this.configService.get('config.jwt.refreshExpiresIn', '7d'),
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

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

  private async createAndSendAccountEmailCode({
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

  private getAccountEmailCodeKey(
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

  private async verifyAccountEmailCode<T extends AccountEmailCodeData>(
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

  private assertActiveAccount(user: Pick<User, 'status'>): void {
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }
  }

  private normalizeEmailCode(code?: string): string {
    const normalized = (code ?? '').trim().toUpperCase().replace(/\s/g, '');

    if (normalized.length === 10 && !normalized.includes('-')) {
      return `${normalized.slice(0, 5)}-${normalized.slice(5)}`;
    }

    return normalized;
  }

  private createAuditLogData({
    userId,
    action,
    userAgent,
    ipAddress,
    metadata,
  }: AuditContext & {
    userId: string;
    action: string;
    metadata?: Prisma.InputJsonObject;
  }): Prisma.AuditLogUncheckedCreateInput {
    return {
      userId,
      action,
      userAgent,
      ipAddress,
      metadata,
    };
  }

  private formatAuditDate(value?: Date | string | null): string | null {
    if (!value) return null;

    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }

    return value.slice(0, 10);
  }

  private transformUser(user: any) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      coverUrl: user.coverUrl,
      website: user.website,
      location: user.location,
      verified: user.verified,
      isPrivate: user.isPrivate,
      link: user.link,
      linkTitle: user.linkTitle,
      interests: user.interests,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      postsCount: user.postsCount,
      createdAt: user.createdAt,
      dateOfBirth: user.dateOfBirth,
    };
  }

  private async scheduleCleanup(
    keys: string[],
    reason: CleanupJobData['reason'],
  ) {
    await this.cleanupQueue.add(
      JOB_NAMES.CLEANUP_FAILED_UPLOAD,
      { keys, reason },
      {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        delay: 1000, // Delay 1s before cleanup
      },
    );
  }
}
