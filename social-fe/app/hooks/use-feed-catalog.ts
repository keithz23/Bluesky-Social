import { InfiniteData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Feed } from "../interfaces/feed.interface";
import { FeedService } from "../services/feed.service";
import { infiniteQueryOptions } from "./infinite-query-options";

export const useFeedCatalog = () =>
  useQuery({
    queryKey: ["feed-catalog"],
    queryFn: FeedService.getCatalog,
    staleTime: 60_000,
  });

export const useTogglePinnedFeed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, pin }: { slug: string; pin: boolean }) =>
      pin ? FeedService.pin(slug) : FeedService.unpin(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-catalog"] });
      queryClient.invalidateQueries({ queryKey: ["pinned-feeds"] });
    },
  });
};

type FeedPage = { posts: Feed[]; nextCursor: string | null; hasMore: boolean };

export const useSystemFeed = (slug: string) => {
  const [seed] = useState(() => crypto.randomUUID());
  return useInfiniteQuery<
    FeedPage,
    Error,
    InfiniteData<FeedPage>,
    [string, string],
    string | undefined
  >({
    queryKey: ["system-feed", slug],
    queryFn: ({ pageParam }) => FeedService.getSystemFeed(slug, pageParam, 30, seed),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
    enabled: Boolean(slug),
    ...infiniteQueryOptions,
  });
};
