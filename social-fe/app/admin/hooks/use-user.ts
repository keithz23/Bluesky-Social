import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserService } from "../services/user.service";

export const useUser = (page?: number, limit?: number) => {
  const qc = useQueryClient();

  const {
    data: userData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["users", page, limit],
    queryFn: () => UserService.findAll(page, limit),
    placeholderData: (prev) => prev,
  });
  return {
    userData,
    isUserLoading: isLoading,
    isUserFetching: isFetching,
    userError: error,
    userRefetch: refetch,
  };
};
