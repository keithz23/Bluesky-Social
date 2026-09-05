import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { S3Service } from 'src/uploads/s3.service';
import { UploadCleanupService } from 'src/uploads/upload-cleanup.service';
import { assertMinimumAccountAge } from 'src/common/utils/account-age.util';
import {
  ChangeDateOfBirthDto,
  ChangeUsernameDto,
  UpdateAccountPrivacyDto,
  UpdateProfileDto,
} from '../dto/requests';
import {
  CurrentUserResponseDto,
  FollowStatus,
  ProfileResponseDto,
} from '../dto/responses';
import {
  PUBLIC_PROFILE_SELECT,
  toCurrentUserResponse,
  toProfileResponse,
} from '../mappers/user-response.mapper';

@Injectable()
export class UserProfileService {
  private readonly logger = new Logger(UserProfileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly uploadCleanup: UploadCleanupService,
  ) {}

  async getPublicProfile(
    username: string,
    currentUserId: string,
  ): Promise<ProfileResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: PUBLIC_PROFILE_SELECT,
    });

    if (!user) throw new NotFoundException('User not found');
    if (user.id === currentUserId) {
      return toProfileResponse(user, { followStatus: null, isOwner: true });
    }

    const [follow, request] = await Promise.all([
      this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: user.id,
          },
        },
      }),
      this.prisma.followRequest.findUnique({
        where: {
          senderId_receiverId: {
            senderId: currentUserId,
            receiverId: user.id,
          },
        },
      }),
    ]);

    const followStatus = follow
      ? FollowStatus.FOLLOWING
      : request
        ? FollowStatus.REQUESTED
        : FollowStatus.NONE;

    return toProfileResponse(user, { followStatus, isOwner: false });
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    avatar?: Express.Multer.File[],
    cover?: Express.Multer.File[],
  ): Promise<CurrentUserResponseDto> {
    const uploadedKeys: string[] = [];
    let avatarUrl: string | undefined;
    let coverUrl: string | undefined;

    try {
      if (avatar?.length) {
        const [result] = await this.s3Service
          .uploadImages(avatar, `public/avatar/${userId}`, {
            resize: true,
            quality: 85,
          })
          .catch((error: unknown) => {
            this.logger.error('Error uploading avatar', error);
            throw new BadRequestException('Failed to upload avatar');
          });
        uploadedKeys.push(result.key);
        avatarUrl = result.url;
      }

      if (cover?.length) {
        const [result] = await this.s3Service
          .uploadImages(cover, `public/cover/${userId}`, {
            resize: true,
            quality: 85,
          })
          .catch((error: unknown) => {
            this.logger.error('Error uploading cover', error);
            throw new BadRequestException('Failed to upload cover');
          });
        uploadedKeys.push(result.key);
        coverUrl = result.url;
      }

      const oldUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { avatarUrl: true, coverUrl: true },
      });
      if (!oldUser) throw new NotFoundException('User not found');

      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...dto,
          ...(avatarUrl ? { avatarUrl } : {}),
          ...(coverUrl ? { coverUrl } : {}),
        },
      });

      const replacedKeys = [
        avatarUrl && oldUser.avatarUrl
          ? this.s3Service.extractKeyFromUrl(oldUser.avatarUrl)
          : null,
        coverUrl && oldUser.coverUrl
          ? this.s3Service.extractKeyFromUrl(oldUser.coverUrl)
          : null,
      ].filter((key): key is string => Boolean(key));

      if (replacedKeys.length) {
        void this.uploadCleanup
          .schedule(replacedKeys, 'replaced_by_new_upload')
          .catch((error: unknown) =>
            this.logger.warn('Failed to schedule old image cleanup', error),
          );
      }

      return toCurrentUserResponse(user);
    } catch (error) {
      if (uploadedKeys.length) {
        await this.uploadCleanup.schedule(uploadedKeys, 'transaction_failed');
      }
      throw error;
    }
  }

  async changeUsername(
    userId: string,
    dto: ChangeUsernameDto,
  ): Promise<CurrentUserResponseDto> {
    const normalizedUsername = dto.username.trim();
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
    dto: ChangeDateOfBirthDto,
  ): Promise<CurrentUserResponseDto> {
    const birthDate = new Date(dto.dateOfBirth);
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

  async updatePrivacy(
    userId: string,
    dto: UpdateAccountPrivacyDto,
  ): Promise<CurrentUserResponseDto> {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!currentUser) throw new NotFoundException('User not found');
    if (currentUser.isPrivate === dto.isPrivate) {
      return toCurrentUserResponse(currentUser);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { isPrivate: dto.isPrivate },
    });
    return toCurrentUserResponse(user);
  }
}
