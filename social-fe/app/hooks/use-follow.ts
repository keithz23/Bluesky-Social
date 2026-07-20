import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { FollowService } from "../services/follow.service";
import { infiniteQueryOptions } from "./infinite-query-options";
import { User } from "../interfaces/user.interface";

type FollowingResponse = {
  following: Array<
    User & {
      followId: string;
      followedAt: string;
      isAdded?: boolean;
    }
  >;
  nextCursor: string | null;
  hasMore: boolean;
};

type FollowerResponse = {
  follower: Array<
    User & {
      followerId: string;
      followerAt: string;
    }
  >;
  nextCursor: string | null;
  hasMore: boolean;
};

export type ReceivedFollowRequest = User & {
  requestId: string;
  requestedAt: string;
};

export type ReceivedFollowRequestsResponse = {
  receivedFollow: ReceivedFollowRequest[];
  nextCursor: string | null;
  hasMore: boolean;
};

export const useFollowStatus = (targetUserId: string) => {
  return useQuery({
    queryKey: ["follow-status", targetUserId],
    queryFn: () => FollowService.getStatus(targetUserId),
  });
};

export const useFollow = (targetUserId: string) => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: ["follow-status", targetUserId],
    });
    queryClient.invalidateQueries({ queryKey: ["feed"] });
  };

  const follow = useMutation({
    mutationFn: () => FollowService.follow(targetUserId),
    onSuccess: invalidate,
  });

  const unfollow = useMutation({
    mutationFn: () => FollowService.unfollow(targetUserId),
    onSuccess: invalidate,
  });

  return { follow, unfollow };
};

export const useReceivedFollowRequests = (options?: { enabled?: boolean }) => {
  return useInfiniteQuery<
    ReceivedFollowRequestsResponse,
    Error,
    InfiniteData<ReceivedFollowRequestsResponse>,
    [string],
    string | undefined
  >({
    queryKey: ["received-follow-requests"],
    queryFn: ({ pageParam }) =>
      FollowService.getReceivedFollowRequests(
        pageParam as string | undefined,
      ),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: options?.enabled ?? true,
    ...infiniteQueryOptions,
  });
};

export const useFollowRequestActions = () => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: ["received-follow-requests"],
    });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const accept = useMutation({
    mutationFn: (senderId: string) => FollowService.acceptRequest(senderId),
    onSuccess: invalidate,
  });

  const decline = useMutation({
    mutationFn: (senderId: string) => FollowService.declineRequest(senderId),
    onSuccess: invalidate,
  });

  return { accept, decline };
};

export const useGetFollowingLists = (
  username: string,
  listId?: string,
  options?: { enabled?: boolean },
) => {
  return useInfiniteQuery<
    FollowingResponse,
    Error,
    InfiniteData<FollowingResponse>,
    [string, string, string | undefined],
    string | undefined
  >({
    queryKey: ["followings", username, listId],

    queryFn: ({ pageParam }) =>
      FollowService.getFollowingLists(
        username,
        pageParam as string | undefined,
        listId,
      ),

    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: !!username && (options?.enabled ?? true),
    ...infiniteQueryOptions,
  });
};

export const useGetFollowerLists = (
  username: string,
  options?: { enabled?: boolean },
) => {
  return useInfiniteQuery<
    FollowerResponse,
    Error,
    InfiniteData<FollowerResponse>,
    [string, string],
    string | undefined
  >({
    queryKey: ["followers", username],

    queryFn: ({ pageParam }) =>
      FollowService.getFollowerLists(username, pageParam as string | undefined),

    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: !!username && (options?.enabled ?? true),
    ...infiniteQueryOptions,
  });
};
