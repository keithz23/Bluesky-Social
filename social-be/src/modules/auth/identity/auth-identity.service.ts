import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { LoginDto, RegisterDto } from '../dto/requests';
import { HashUtil } from '../../../common/utils/hash.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { ERROR_MESSAGES } from 'src/common/constants/error-message';
import { MailService } from 'src/mail/mail.service';
import { UserStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { S3Service } from 'src/uploads/s3.service';
import { JwtUtils } from '../utils/jwt.util';
import { TwoFactorUtils } from '../utils/two-factor.util';
import { OtherUtils } from '../utils/other.util';
import { SettingsService } from '../../admin/settings/settings.service';
import {
  AuthSessionResponseDto,
  LoginResponse,
  RegisterResponseDto,
} from '../dto/responses';
import {
  toCurrentUserResponse,
  toRegisterResponse,
  toRoleResponses,
} from '../mappers/auth-response.mapper';
import { GoogleAuthUser } from '../interfaces/auth.interface';
import { assertMinimumAccountAge } from 'src/common/utils/account-age.util';

@Injectable()
export class AuthIdentityService {
  private logger = new Logger(AuthIdentityService.name);
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private s3Service: S3Service,
    private jwtUtils: JwtUtils,
    private twoFactorUtils: TwoFactorUtils,
    private otherUtils: OtherUtils,
    private readonly settingsService: SettingsService,
  ) {}

  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const registrationEnabled = await this.settingsService.getBoolean(
      'account.registration_enabled',
    );
    if (!registrationEnabled) {
      throw new ForbiddenException(
        'New account registration is currently disabled',
      );
    }

    const { email, username, password, dateOfBirth } = registerDto;
    const birthDate = new Date(dateOfBirth);
    assertMinimumAccountAge(birthDate);

    const existingEmail = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      throw new ConflictException(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    const existingUsername = await this.prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      throw new ConflictException(ERROR_MESSAGES.USERNAME_ALREADY_EXISTS);
    }

    const passwordHash = await HashUtil.hash(password);

    const newUser = await this.prisma.$transaction(async (prisma) => {
      const user = await prisma.user.create({
        data: {
          email,
          username,
          passwordHash,
          dateOfBirth: birthDate,
          displayName: username,
        },
      });

      const verifyToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await prisma.emailVerificationToken.create({
        data: { token: verifyToken, userId: user.id, expiresAt },
      });

      await this.mailService.sendVerifyEmail(
        user.email,
        verifyToken,
        user.username,
      );

      return user;
    });

    return toRegisterResponse(newUser);
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

    const requireEmailVerification = await this.settingsService.getBoolean(
      'account.require_email_verification',
    );
    if (requireEmailVerification && !user.verified) {
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
      user: toCurrentUserResponse(user),
      roles: toRoleResponses(user),
    };
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

  async googleLogin(
    googleUser: GoogleAuthUser,
    ipAddress: string,
    userAgent: string,
  ): Promise<AuthSessionResponseDto> {
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
        user: toCurrentUserResponse(user),
        roles: toRoleResponses(user),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    }

    // User chưa tồn tại -> tạo mới, gán role mặc định
    const registrationEnabled = await this.settingsService.getBoolean(
      'account.registration_enabled',
    );
    if (!registrationEnabled) {
      throw new ForbiddenException(
        'New account registration is currently disabled',
      );
    }

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
      user: toCurrentUserResponse(newUser),
      roles: toRoleResponses(newUser),
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
}
