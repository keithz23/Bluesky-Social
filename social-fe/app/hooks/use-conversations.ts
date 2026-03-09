import { useInfiniteQuery } from "@tanstack/react-query";
import { ChatService } from "@/app/services/chat.service";

export function useConversations() {
  return useInfiniteQuery({
    queryKey: ["conversations"],
    queryFn: ({ pageParam }) =>
      ChatService.getConversations({
        cursor: pageParam as string | undefined,
        limit: 20,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
