import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { ChatService } from "@/app/services/chat.service";
import { infiniteQueryOptions } from "./infinite-query-options";
import { ConversationsResponse } from "../interfaces/chat.interface";

export function useConversations(enabled = true) {
  return useInfiniteQuery<
    ConversationsResponse,
    Error,
    InfiniteData<ConversationsResponse>,
    [string],
    string | undefined
  >({
    queryKey: ["conversations"],
    queryFn: ({ pageParam }) =>
      ChatService.getConversations({
        cursor: pageParam as string | undefined,
        limit: 20,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
    ...infiniteQueryOptions,
  });
}
