import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { addMinutes } from 'date-fns';
import { randomBytes } from 'crypto';
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
import { PasswordResetToken } from '@prisma/client';

const RESET_TTL_MINUTES = 30;
const RESET_TOKEN_BYTES = 32; // 256-bit

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
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

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        dateOfBirth,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      ...tokens,
      user: this.transformUser(user),
    };
  }

  async login(
    loginDto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const { identifier, password } = loginDto;

    // Find user by email or username
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
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

  async updateProfile(userId: string, updateDto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateDto,
    });

    const profile = this.transformUser(user);

    return profile;
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

    const rawToken = randomBytes(RESET_TOKEN_BYTES).toString('base64url');
    const tokenHash = await HashUtil.hash(rawToken);
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

    await this.mailService.sendResetEmail(
      user.email,
      rawToken,
      user.username,
      RESET_TTL_MINUTES,
    );
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    let { newPassword, token } = resetPasswordDto;

    token = (token ?? '').trim();
    if (!token) throw new BadRequestException('Invalid or expired token');

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
      if (await HashUtil.compare(token, c.tokenHash)) {
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
}
