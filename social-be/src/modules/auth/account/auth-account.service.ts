import { CacheService } from 'src/modules/cache/cache.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailUtils } from '../utils/mail.util';
import { OtherUtils } from '../utils/other.util';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DeactivateAccountDto,
  DeleteAccountDto,
  UpdateEmailDto,
} from '../dto/requests';
import { SuccessResponseDto } from '../dto/responses';
import { UserStatus } from '@prisma/client';
import { AccountEmailCodeData } from '../interfaces/auth.interface';

@Injectable()
export class AuthAccountService {
  constructor(
    private prisma: PrismaService,
    private redisService: CacheService,
    private mailUtils: MailUtils,
    private otherUtils: OtherUtils,
  ) {}

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
  ): Promise<SuccessResponseDto> {
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
  ): Promise<SuccessResponseDto> {
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
    ]);
    await this.redisService.del(redisKey);
    return { message: 'Account deleted successfully.' };
  }

  async deactivateAccount(
    userId: string,
    deactivateAccountDto: DeactivateAccountDto,
  ): Promise<SuccessResponseDto> {
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
    ]);

    await this.redisService.del(redisKey);

    return { message: 'Account deactivated successfully.' };
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
}
