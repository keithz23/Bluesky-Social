import { useInfiniteQuery } from "@tanstack/react-query";
import { ChatService } from "@/app/services/chat.service";
import { infiniteQueryOptions } from "./infinite-query-options";

export function useMessages(conversationId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ["messages", conversationId],
    queryFn: ({ pageParam }) =>
      ChatService.getMessages(conversationId!, {
        cursor: pageParam as string | undefined,
        limit: 30,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!conversationId,
    ...infiniteQueryOptions,
  });
}
