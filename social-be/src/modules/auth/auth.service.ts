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
import { PasswordResetToken, User } from '@prisma/client';
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

const RESET_TTL_MINUTES = 15;

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
    userId: string,
    refreshToken: string,
  ): Promise<{ message: string }> {
    // Delete specific refresh token
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
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

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await HashUtil.compare(
      currentPassword,
      user.passwordHash ?? '',
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await HashUtil.hash(newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Revoke all refresh tokens (force re-login on all devices)
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return { message: 'Password changed successfully. Please login again.' };
  }

  async requestPasswordReset(
    email: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      return;
    }

    const activeCount = await this.prisma.passwordResetToken.count({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (activeCount >= 3) return;

    const rawCode = generateResetCode();
    const tokenHash = await HashUtil.hash(rawCode);
    const expiresAt = addMinutes(new Date(), RESET_TTL_MINUTES);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        createdIp: ipAddress,
        createdUa: userAgent,
      },
    });

    await this.mailService.sendForgotEmail(user.email, rawCode, user.username);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
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

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: match.userId },
        data: { passwordHash: await HashUtil.hash(newPassword) },
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

    return this.transformUser(user);
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

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('config.jwt.seccret'),
      expiresIn: this.configService.get('config.jwt.expiresIn', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('config.jwt.refreshSecret'),
      expiresIn: this.configService.get('config.jwt.refreshExpiresIn', '7d'),
    });

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Save refresh token to database
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

  async googleLogin(googleUser: any, ipAddress: string, userAgent: string) {
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: googleUser.email }],
      },
    });

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
      const tokens = await this.generateTokens(
        user.id,
        user.email,
        ipAddress,
        userAgent,
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
        dateOfBirth: '',
        avatarUrl: googleUser.picture,
        verified: true,
        displayName: username,
      },
    });

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      ipAddress,
      userAgent,
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

  async requestUpdateEmail(userId: string, newEmail: string, userAgent?: string, ipAddress?: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new Error("User not found")


    const normalizedEmail = newEmail.trim().toLowerCase();


    if (normalizedEmail == user.email) throw new ConflictException("This email is already associated with your account.")


    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException("Email already exists.");
    }

    const rawCode = generateResetCode();

    const redisPayload = JSON.stringify({
      new_email: normalizedEmail,
      otp: rawCode
    });

    await this.redisService.set(`email_update:${userId}`, redisPayload, RESET_TTL_MINUTES * 60);

    await this.mailService.sendRequestEmailOtp(user.email, rawCode, user.username);
  }

  async updateEmail(updateEmailDto: UpdateEmailDto, userId: string) {
    const { otp } = updateEmailDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new Error('User not found');

    const redisKey = `email_update:${userId}`;
    const rawData = await this.redisService.get(redisKey);

    if (!rawData) {
      throw new BadRequestException('OTP is invalid or expired');
    }

    const requestUpdateEmailData = JSON.parse(rawData) as {
      new_email: string;
      otp: string;
    };

    if (otp !== requestUpdateEmailData.otp) {
      throw new BadRequestException('Invalid OTP');
    }

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
    ]);

    await this.redisService.del(`email_update:${userId}`)

    return { message: 'Email updated successfully. Please login again.' };
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
