import { PrismaService } from 'src/prisma/prisma.service';
import {
  CurrentSessionResponseDto,
  CurrentUserResponseDto,
} from '../dto/responses';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  toCurrentUserResponse,
  toRoleResponses,
} from '../mappers/auth-response.mapper';
import {
  ChangeDateOfBirthDto,
  ChangeUsernameDto,
  UpdateProfileDto,
} from '../dto/requests';
import { S3Service } from 'src/uploads/s3.service';
import { OtherUtils } from '../utils/other.util';

import { assertMinimumAccountAge } from '../utils/account-age.util';

@Injectable()
export class AuthProfileService {
  private logger = new Logger(AuthProfileService.name);
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
    private otherUtils: OtherUtils,
  ) {}
  async getProfile(userId: string): Promise<CurrentSessionResponseDto> {
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
      user: toCurrentUserResponse(user),
      roles: toRoleResponses(user),
    };
  }

  async updateProfile(
    userId: string,
    updateDto: UpdateProfileDto,
    avatar?: Express.Multer.File[],
    cover?: Express.Multer.File[],
  ): Promise<CurrentUserResponseDto> {
    const uploadedKeys: string[] = [];
    let avatarUrl: string | undefined;
    let coverUrl: string | undefined;

    try {
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
        avatarUrl = results[0].url;
      }

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
        coverUrl = results[0].url;
      }

      const oldUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          avatarUrl: true,
          coverUrl: true,
          username: true,
          displayName: true,
          bio: true,
        },
      });

      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...updateDto,
          ...(avatarUrl ? { avatarUrl } : {}),
          ...(coverUrl ? { coverUrl } : {}),
        },
      });

      if (uploadedKeys.length && oldUser) {
        const oldKeys = [
          avatarUrl && oldUser.avatarUrl
            ? this.s3Service.extractKeyFromUrl(oldUser.avatarUrl)
            : null,
          coverUrl && oldUser.coverUrl
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

      return toCurrentUserResponse(user);
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

  async changeUsername(
    userId: string,
    changeUsernameDto: ChangeUsernameDto,
  ): Promise<CurrentUserResponseDto> {
    const normalizedUsername = changeUsernameDto.username.trim();
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) throw new NotFoundException('User not found');

    const existingUser = await this.prisma.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException('Username already exists.');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        username: normalizedUsername,
        displayName: normalizedUsername,
      },
    });

    return toCurrentUserResponse(user);
  }

  async changeDateOfBirth(
    userId: string,
    changeDateOfBirthDto: ChangeDateOfBirthDto,
  ): Promise<CurrentUserResponseDto> {
    const birthDate = new Date(changeDateOfBirthDto.dateOfBirth);
    assertMinimumAccountAge(birthDate);

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) throw new NotFoundException('User not found');

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { dateOfBirth: birthDate },
    });

    return toCurrentUserResponse(user);
  }
}
