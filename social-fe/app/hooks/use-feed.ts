import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FeedService } from "../services/feed.service";
import { infiniteQueryOptions } from "./infinite-query-options";

export const useFeed = () => {
  const [feedSeed] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
  );

  return useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }) =>
      FeedService.getFeed(pageParam, undefined, feedSeed),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    ...infiniteQueryOptions,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};
