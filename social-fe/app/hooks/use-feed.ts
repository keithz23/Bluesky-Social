import { useInfiniteQuery } from "@tanstack/react-query";
import { FeedService } from "../services/feed.service";

export const useFeed = () => {
  return useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }) => FeedService.getFeed(pageParam),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
  });
};
