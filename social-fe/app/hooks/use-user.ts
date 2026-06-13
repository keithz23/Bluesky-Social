import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "./use-debounce";
import { UserService } from "../services/user.service";

export const useSearchUsers = (
  searchTerm: string,
  limit: number = 10,
  listId?: string,
) => {
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  return useQuery({
    queryKey: ["users", "search", debouncedSearchTerm, limit, listId],
    queryFn: () => UserService.searchUsers(debouncedSearchTerm, limit, listId),

    enabled: !!debouncedSearchTerm,

    placeholderData: (previousData) => previousData,
  });
};
