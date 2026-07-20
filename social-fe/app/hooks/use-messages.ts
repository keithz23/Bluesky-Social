import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { ChatService } from "@/app/services/chat.service";
import { infiniteQueryOptions } from "./infinite-query-options";
import { MessagesResponse } from "../interfaces/chat.interface";

export function useMessages(conversationId: string | undefined) {
  return useInfiniteQuery<
    MessagesResponse,
    Error,
    InfiniteData<MessagesResponse>,
    [string, string | undefined],
    string | undefined
  >({
    ...infiniteQueryOptions,
    queryKey: ["messages", conversationId],
    queryFn: ({ pageParam }) =>
      ChatService.getMessages(conversationId!, {
        cursor: pageParam as string | undefined,
        limit: 30,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!conversationId,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}
