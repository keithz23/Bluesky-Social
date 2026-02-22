import { useEffect, useState, useCallback } from "react";
import { useInView } from "react-intersection-observer";

interface UseInfiniteScrollOptions {
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  enabled?: boolean;
}

export function useInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  enabled = true,
}: UseInfiniteScrollOptions) {
  const [isReady, setIsReady] = useState(false);

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "300px",
    skip: !isReady,
  });

  // Enable observer after a short delay to skip initial mount
  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, [enabled]);

  // Fetch when scrolled into view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && isReady) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, isReady]);

  return { ref, inView, isReady };
}
