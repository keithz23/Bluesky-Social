import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import { User } from "../interfaces/user.interface";

export const FollowService = {
  getFollowingLists: async (
    username: string,
    cursor?: string,
    listId?: string,
    limit?: number,
  ) => {
    return apiClient.get<{
      following: Array<
        User & {
          followId: string;
          followedAt: string;
          isAdded?: boolean;
        }
      >;
      nextCursor: string | null;
      hasMore: boolean;
    }>(
      API_ENDPOINT.FOLLOWS.FOLLOWING_LISTS({ cursor, limit, username, listId }),
    );
  },

  getFollowerLists: async (
    username: string,
    cursor?: string,
    limit?: number,
  ) => {
    return apiClient.get<{
      follower: Array<
        User & {
          followerId: string;
          followerAt: string;
        }
      >;
      nextCursor: string | null;
      hasMore: boolean;
    }>(
      API_ENDPOINT.FOLLOWS.FOLLOWER_LISTS({ cursor, limit, username }),
    );
  },

  getStatus: (userId: string) => {
    return apiClient.get<{
      status: "following" | "requested" | "none";
    }>(API_ENDPOINT.FOLLOWS.STATUS(userId));
  },

  getReceivedFollowRequests: async (cursor?: string, limit?: number) => {
    return apiClient.get<{
      receivedFollow: Array<
        User & {
          requestId: string;
          requestedAt: string;
        }
      >;
      nextCursor: string | null;
      hasMore: boolean;
    }>(API_ENDPOINT.FOLLOWS.RECEIVED_REQUESTS({ cursor, limit }));
  },

  follow: (userId: string) => {
    return apiClient.post<unknown>(API_ENDPOINT.FOLLOWS.FOLLOW(userId));
  },

  unfollow: (userId: string) => {
    return apiClient.delete<unknown>(API_ENDPOINT.FOLLOWS.UNFOLLOW(userId));
  },

  acceptRequest: (senderId: string) => {
    return apiClient.post<unknown>(API_ENDPOINT.FOLLOWS.ACCEPT(senderId));
  },

  declineRequest: (senderId: string) => {
    return apiClient.delete<unknown>(API_ENDPOINT.FOLLOWS.DECLINE(senderId));
  },
};
