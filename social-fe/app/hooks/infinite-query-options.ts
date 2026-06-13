export const infiniteQueryOptions = {
  staleTime: 2 * 60_000,
  gcTime: 15 * 60_000,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;
