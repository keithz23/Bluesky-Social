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

export const useGetFollowingLists = (username: string, listId?: string) => {
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
    enabled: !!username,
    ...infiniteQueryOptions,
  });
};

export const useGetFollowerLists = (username: string) => {
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
    enabled: !!username,
    ...infiniteQueryOptions,
  });
};
