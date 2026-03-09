import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "./use-debounce";
import { UserService } from "../services/user.service";

export const useSearchUsers = (searchTerm: string, limit: number = 10) => {
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  return useQuery({
    queryKey: ["users", "search", debouncedSearchTerm, limit],
    queryFn: () => UserService.searchUsers(debouncedSearchTerm, limit),

    enabled: !!debouncedSearchTerm,

    placeholderData: (previousData) => previousData,
  });
};
