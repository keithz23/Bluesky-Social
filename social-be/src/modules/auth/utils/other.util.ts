import { InjectQueue } from '@nestjs/bullmq';
import { UnauthorizedException } from '@nestjs/common';
import { Prisma, User, UserStatus } from '@prisma/client';
import { Queue } from 'bullmq';
import {
  CleanupJobData,
  JOB_NAMES,
  QUEUE_NAMES,
} from 'src/common/constants/queue.constant';
import { AuditContext } from 'src/common/interfaces/auth.interface';

export class OtherUtils {
  constructor(
    @InjectQueue(QUEUE_NAMES.CLEANUP)
    private cleanupQueue: Queue<CleanupJobData>,
  ) {}
  public assertActiveAccount(user: Pick<User, 'status'>): void {
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }
  }

  public createAuditLogData({
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

  public formatAuditDate(value?: Date | string | null): string | null {
    if (!value) return null;

    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }

    return value.slice(0, 10);
  }

  public transformUser(user: any) {
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
      hasPassword: Boolean(user.passwordHash),
      twoFactorEnabled: user.twoFactorEnabled,
      twoFactorMethod: user.twoFactorMethod,
      twoFactorEnabledAt: user.twoFactorEnabledAt,
    };
  }

  public async scheduleCleanup(
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
