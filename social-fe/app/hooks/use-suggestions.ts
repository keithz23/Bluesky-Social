import { useQuery } from "@tanstack/react-query";
import { SuggestionsService } from "../services/suggestion.service";

export const useSuggestedUsers = (limit?: number) => {
  return useQuery({
    queryKey: ["suggestions", "users"],
    queryFn: () => SuggestionsService.getSuggestedUsers(limit),
    staleTime: 1000 * 60 * 5,
  });
};
