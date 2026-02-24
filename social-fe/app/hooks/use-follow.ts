import { axiosInstance } from "@/lib/axios";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import { FollowService } from "../services/follow.service";

export const useFollowStatus = (targetUserId: string) => {
  return useQuery({
    queryKey: ["follow-status", targetUserId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        API_ENDPOINT.FOLLOWS.STATUS(targetUserId),
      );
      return data; // { status: 'following' | 'requested' | 'none' }
    },
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
    mutationFn: () =>
      axiosInstance.post(API_ENDPOINT.FOLLOWS.FOLLOW(targetUserId)),
    onSuccess: invalidate,
  });

  const unfollow = useMutation({
    mutationFn: () =>
      axiosInstance.delete(API_ENDPOINT.FOLLOWS.UNFOLLOW(targetUserId)),
    onSuccess: invalidate,
  });

  return { follow, unfollow };
};

export const useGetFollowingLists = (username: string) => {
  return useInfiniteQuery({
    queryKey: ["followings", username],

    queryFn: ({ pageParam }) =>
      FollowService.getFollowingLists(
        username,
        pageParam as string | undefined,
      ),

    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
  });
};

export const useGetFollowerLists = (username: string) => {
  return useInfiniteQuery({
    queryKey: ["followers", username],

    queryFn: ({ pageParam }) =>
      FollowService.getFollowerLists(username, pageParam as string | undefined),

    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
  });
};
