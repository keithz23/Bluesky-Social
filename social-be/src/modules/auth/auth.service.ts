import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
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
import {
  PasswordResetToken,
  TwoFactorMethod,
  User,
  UserStatus,
} from '@prisma/client';
import * as crypto from 'crypto';
import { S3Service } from 'src/uploads/s3.service';
import { UpdateEmailDto } from './dto/update-email.dto';
import { CacheService } from '../cache/cache.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeUsernameDto } from './dto/change-username.dto';
import { ChangeDateOfBirthDto } from './dto/change-dob.dto';
import { DeactivateAccountDto } from './dto/deactivate-account-dto';
import { Enable2FADto } from './dto/enable-2fa.dto';
import { VerifyLogin2FADto } from './dto/verify-login-2fa.dto';
import { Disable2FADto } from './dto/disable-2fa.dto';
import { Setup2FADto } from './dto/setup-2fa.dto';
import { UpdateAccountPrivacyDto } from './dto/update-account-privacy.dto';
import {
  AccountEmailCodeData,
  Login2FAChallengeData,
  LoginResponse,
  TotpSetupData,
} from 'src/common/interfaces/auth.interface';

import {
  LOGIN_2FA_TTL_SECONDS,
  MAX_LOGIN_2FA_ATTEMPTS,
  TOTP_ISSUER,
  TOTP_SETUP_TTL_SECONDS,
} from 'src/common/constants/auth-config.constant';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { JwtUtils } from './utils/jwt.util';
import { MailUtils } from './utils/mail.util';
import { TwoFactorUtils } from './utils/two-factor.util';
import { OtherUtils } from './utils/other.util';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private s3Service: S3Service,
    private redisService: CacheService,
    private jwtUtils: JwtUtils,
    private mailUtils: MailUtils,
    private twoFactorUtils: TwoFactorUtils,
    private otherUtils: OtherUtils,
  ) {}

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
  ): Promise<LoginResponse> {
    const { account, password } = loginDto;

    // Find user by email or username
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: account }, { username: account }],
      },
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

    if (!user.verified) {
      throw new UnauthorizedException(
        'Please check your email and verify your account before logging in.',
      );
    }

    this.otherUtils.assertActiveAccount(user);

    if (user.twoFactorEnabled) {
      if (!this.twoFactorUtils.hasConfiguredTotp(user)) {
        throw new BadRequestException(
          'Two-factor authentication is not configured for authenticator app. Please disable and set it up again.',
        );
      }

      return this.twoFactorUtils.createAndSendLogin2FAChallenge(
        user,
        userAgent,
        ipAddress,
      );
    }
    // Generate tokens with device info
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

    // Update last activity
    await this.prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() },
    });

    return {
      ...tokens,
      user: this.otherUtils.transformUser(user),
      roles: this.otherUtils.transformRoles(user),
    };
  }

  async verifyLogin2FA(
    dto: VerifyLogin2FADto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
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

    await this.prisma.auditLog.create({
      data: this.otherUtils.createAuditLogData({
        userId: user.id,
        action: 'MFA_LOGIN_SUCCESS',
        userAgent,
        ipAddress,
        metadata: {
          method:
            method === 'recovery_code'
              ? 'RECOVERY_CODE'
              : 'TOTP_OR_RECOVERY_CODE',
        },
      }),
    });

    return {
      ...tokens,
      user: this.otherUtils.transformUser(user),
      roles: this.otherUtils.transformRoles(user),
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponseDto> {
    // Verify refresh token in database
    const tokenDoc = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
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
      user: this.otherUtils.transformUser(user),
      roles: this.otherUtils.transformRoles(user),
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

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      user: this.otherUtils.transformUser(user),
      roles: this.otherUtils.transformRoles(user),
    };
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
          this.otherUtils
            .scheduleCleanup(oldKeys as string[], 'replaced_by_new_upload')
            .catch((err) =>
              this.logger.warn('Failed to schedule old image cleanup', err),
            );
        }
      }

      return this.otherUtils.transformUser(user);
    } catch (error) {
      if (uploadedKeys.length) {
        await this.otherUtils.scheduleCleanup(
          uploadedKeys,
          'transaction_failed',
        );
        this.logger.warn(
          `Scheduled cleanup for ${uploadedKeys.length} orphaned files`,
        );
      }
      throw error;
    }
  }

  async updateAccountPrivacy(
    userId: string,
    updateAccountPrivacyDto: UpdateAccountPrivacyDto,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) throw new NotFoundException('User not found');
    this.otherUtils.assertActiveAccount(currentUser);

    const { isPrivate } = updateAccountPrivacyDto;

    if (currentUser.isPrivate === isPrivate) {
      return this.otherUtils.transformUser(currentUser);
    }

    const [user] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { isPrivate },
      }),
      this.prisma.auditLog.create({
        data: this.otherUtils.createAuditLogData({
          userId,
          action: 'ACCOUNT_PRIVACY_CHANGED',
          userAgent,
          ipAddress,
          metadata: {
            oldIsPrivate: currentUser.isPrivate,
            newIsPrivate: isPrivate,
          },
        }),
      }),
    ]);

    return this.otherUtils.transformUser(user);
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
        data: this.otherUtils.createAuditLogData({
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

    return this.otherUtils.transformUser(user);
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
        data: this.otherUtils.createAuditLogData({
          userId,
          action: 'ACCOUNT_BIRTHDAY_CHANGED',
          userAgent,
          ipAddress,
          metadata: {
            oldDateOfBirth: this.otherUtils.formatAuditDate(
              currentUser.dateOfBirth,
            ),
            newDateOfBirth: this.otherUtils.formatAuditDate(birthDate),
          },
        }),
      }),
    ]);

    return this.otherUtils.transformUser(user);
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
      this.prisma.auditLog.create({
        data: this.otherUtils.createAuditLogData({
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
        data: this.otherUtils.createAuditLogData({
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

    return this.otherUtils.transformUser(user);
  }

  private readonly userWithRolesInclude = {
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
  } as const;

  async googleLogin(googleUser: any, ipAddress: string, userAgent: string) {
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: googleUser.email }],
      },
      include: this.userWithRolesInclude,
    });

    if (user && user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException({
        message: 'Account is not active',
        code: 'ACCOUNT_NOT_ACTIVE',
        email: user.email,
      });
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

    // User đã tồn tại và đã link Google -> login bình thường
    if (user && user.googleId) {
      if (
        googleUser.picture &&
        (!user.avatarUrl || this.isGoogleAvatarUrl(user.avatarUrl))
      ) {
        const avatarUrl = await this.importGoogleAvatar(
          googleUser.picture,
          user.id,
        );
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl },
          include: this.userWithRolesInclude,
        });
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

    // User chưa tồn tại -> tạo mới, gán role mặc định
    const baseUsername = googleUser.email.split('@')[0];
    let username = baseUsername;
    let counter = 1;

    while (await this.prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    const defaultRole = await this.prisma.role.findUnique({
      where: { name: 'user' },
    });

    if (!defaultRole) {
      throw new InternalServerErrorException(
        'Default role "user" is not configured',
      );
    }

    let newUser = await this.prisma.user.create({
      data: {
        email: googleUser.email,
        username,
        googleId: googleUser.googleId,
        avatarUrl: null,
        verified: true,
        displayName: username,
        userRoles: {
          create: {
            roleId: defaultRole.id,
          },
        },
      },
      include: this.userWithRolesInclude,
    });

    if (googleUser.picture) {
      const avatarUrl = await this.importGoogleAvatar(
        googleUser.picture,
        newUser.id,
      );
      newUser = await this.prisma.user.update({
        where: { id: newUser.id },
        data: { avatarUrl },
        include: this.userWithRolesInclude,
      });
    }

    const tokens = await this.jwtUtils.generateTokens(
      newUser.id,
      newUser.email,
      newUser.username,
      newUser.userRoles.map((ur) => ({
        name: ur.role.name,
        permissions: ur.role.rolePermissions.map((rp) => rp.permission),
      })),
      userAgent,
      ipAddress,
    );

    return {
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        avatarUrl: newUser.avatarUrl,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  private async importGoogleAvatar(pictureUrl: string, userId: string) {
    try {
      const response = await fetch(pictureUrl);
      if (!response.ok) {
        throw new Error(`Google avatar download failed: ${response.status}`);
      }

      const contentType = (response.headers.get('content-type') ?? 'image/jpeg')
        .split(';')[0]
        .trim();
      if (!contentType.startsWith('image/')) {
        throw new Error(`Invalid Google avatar content type: ${contentType}`);
      }

      const extensionByContentType: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
      };
      const extension = extensionByContentType[contentType];
      if (!extension) {
        throw new Error(
          `Unsupported Google avatar content type: ${contentType}`,
        );
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const file = {
        fieldname: 'avatar',
        originalname: `google-avatar.${extension}`,
        encoding: '7bit',
        mimetype: contentType,
        size: buffer.length,
        buffer,
      } as Express.Multer.File;
      const uploaded = await this.s3Service.uploadImage(
        file,
        `public/avatar/${userId}`,
        { resize: true, quality: 85 },
      );

      return uploaded.url;
    } catch (error) {
      this.logger.warn('Failed to import Google avatar', error);
      return pictureUrl;
    }
  }

  private isGoogleAvatarUrl(url: string) {
    try {
      const hostname = new URL(url).hostname;
      return (
        hostname === 'googleusercontent.com' ||
        hostname.endsWith('.googleusercontent.com')
      );
    } catch {
      return false;
    }
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
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ message: string; recoveryCodes: string[] }> {
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
      this.prisma.auditLog.create({
        data: this.otherUtils.createAuditLogData({
          userId,
          action: 'MFA_TOTP_ENABLED',
          userAgent,
          ipAddress,
          metadata: {
            method: 'TOTP',
            recoveryCodeCount: recoveryCodes.length,
          },
        }),
      }),
    ]);

    await this.redisService.del(setupKey);

    return {
      message: 'Two-factor authentication enabled successfully.',
      recoveryCodes,
    };
  }

  async requestDisable2FA(
    userId: string,
    _userAgent?: string,
    _ipAddress?: string,
  ) {
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
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ message: string }> {
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
      this.prisma.auditLog.create({
        data: this.otherUtils.createAuditLogData({
          userId,
          action: 'MFA_DISABLED',
          userAgent,
          ipAddress,
          metadata: {
            method: user.twoFactorMethod ?? 'UNKNOWN',
            appPasswordsRevoked: true,
          },
        }),
      }),
    ]);

    return { message: 'Two-factor authentication disabled successfully' };
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

    await this.mailUtils.createAndSendAccountEmailCode({
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
      await this.mailUtils.verifyAccountEmailCode<
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
        data: this.otherUtils.createAuditLogData({
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
    this.otherUtils.assertActiveAccount(user);

    await this.mailUtils.createAndSendAccountEmailCode({
      user,
      purpose: 'deactivate-account',
      userAgent,
      ipAddress,
    });
  }

  async requestDeleteAccount(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');
    this.otherUtils.assertActiveAccount(user);

    await this.mailUtils.createAndSendAccountEmailCode({
      user,
      purpose: 'delete-account',
      userAgent,
      ipAddress,
    });
  }

  async deleteAccount(
    userId: string,
    deleteAccountDto: DeleteAccountDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ message: string }> {
    const { otp } = deleteAccountDto;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');
    this.otherUtils.assertActiveAccount(user);

    const { redisKey } = await this.mailUtils.verifyAccountEmailCode(
      'delete-account',
      userId,
      otp,
    );

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          status: UserStatus.DELETED,
          deletedAt: new Date(),
        },
      }),
      this.prisma.refreshToken.deleteMany({
        where: { userId },
      }),
      this.prisma.auditLog.create({
        data: this.otherUtils.createAuditLogData({
          userId,
          action: 'DELETE_ACCOUNT',
          userAgent,
          ipAddress,
          metadata: {
            status: 'DELETED',
            refreshTokensRevoked: true,
          },
        }),
      }),
    ]);
    await this.redisService.del(redisKey);
    return { message: 'Account deleted successfully.' };
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
    this.otherUtils.assertActiveAccount(user);

    const { redisKey } = await this.mailUtils.verifyAccountEmailCode(
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
        data: this.otherUtils.createAuditLogData({
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
}
