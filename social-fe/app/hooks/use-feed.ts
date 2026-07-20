import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FeedService } from "../services/feed.service";
import { infiniteQueryOptions } from "./infinite-query-options";
import { Feed } from "../interfaces/feed.interface";

type FeedResponse = {
  posts: Feed[];
  nextCursor: string | null;
  hasMore: boolean;
};

export const useFeed = () => {
  const [feedSeed] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
  );

  return useInfiniteQuery<
    FeedResponse,
    Error,
    InfiniteData<FeedResponse>,
    [string],
    string | undefined
  >({
    queryKey: ["feed"],
    queryFn: ({ pageParam }) =>
      FeedService.getFeed(pageParam as string | undefined, 30, feedSeed),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    ...infiniteQueryOptions,
  });
};
