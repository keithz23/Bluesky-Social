import { Injectable } from '@nestjs/common';
import { FollowQueryDto } from './dto/requests/follow-query.dto';
import { FollowRequestQueryDto } from './dto/requests/follow-request-query.dto';
import { FollowsCommandService } from './services/follows-command.service';
import { FollowsQueryService } from './services/follows-query.service';

@Injectable()
export class FollowsService {
  constructor(
    private readonly commands: FollowsCommandService,
    private readonly queries: FollowsQueryService,
  ) {}

  follow(followerId: string, followingId: string) {
    return this.commands.follow(followerId, followingId);
  }

  unfollow(followerId: string, followingId: string) {
    return this.commands.unfollow(followerId, followingId);
  }

  acceptFollowRequest(currentUserId: string, senderId: string) {
    return this.commands.acceptFollowRequest(currentUserId, senderId);
  }

  declineFollowRequest(currentUserId: string, senderId: string) {
    return this.commands.declineFollowRequest(currentUserId, senderId);
  }

  getFollowStatus(currentUserId: string, targetUserId: string) {
    return this.queries.getFollowStatus(currentUserId, targetUserId);
  }

  getFollowingLists(currentUserId: string, query: FollowQueryDto) {
    return this.queries.getFollowingLists(currentUserId, query);
  }

  getFollowerLists(currentUserId: string, query: FollowQueryDto) {
    return this.queries.getFollowerLists(currentUserId, query);
  }

  getReceivedFollowRequests(
    userId: string,
    query: FollowRequestQueryDto,
  ) {
    return this.queries.getReceivedFollowRequests(userId, query);
  }
}
