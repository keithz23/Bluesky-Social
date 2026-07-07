import type { QueryClient } from "@tanstack/react-query";

type ClearAuthStore = () => void;

export const clearAuthSessionCache = async (
  queryClient: QueryClient,
  clearAuth: ClearAuthStore,
) => {
  clearAuth();
  await queryClient.cancelQueries();
  queryClient.setQueryData(["me"], null);
  queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] !== "me",
  });
};
