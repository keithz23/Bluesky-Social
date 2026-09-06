import type { IsoDateTimeString } from "../common/api-envelope";
import type { FollowStatus, UserSummaryResponse } from "../users/responses";

export interface FollowActionResponse {
  success: boolean;
  status?: FollowStatus | "unfollowed";
}

export interface FollowStatusResponse {
  status: FollowStatus;
}

export type FollowingUserResponse = UserSummaryResponse & {
  followId: string;
  followedAt: IsoDateTimeString;
  isAdded?: boolean;
};

export type FollowerUserResponse = UserSummaryResponse & {
  followerId: string;
  followerAt: IsoDateTimeString;
};

export type ReceivedFollowRequestResponse = UserSummaryResponse & {
  requestId: string;
  requestedAt: IsoDateTimeString;
};

export interface FollowingPageResponse {
  following: FollowingUserResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface FollowersPageResponse {
  follower: FollowerUserResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ReceivedFollowRequestsPageResponse {
  receivedFollow: ReceivedFollowRequestResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}
