import { useInfiniteQuery } from "@tanstack/react-query";
import { FeedService } from "../services/feed.service";
import { infiniteQueryOptions } from "./infinite-query-options";

export const useFeed = () => {
  return useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }) => FeedService.getFeed(pageParam),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    ...infiniteQueryOptions,
  });
};
