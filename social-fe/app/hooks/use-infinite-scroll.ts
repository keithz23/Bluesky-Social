import { useEffect, useState, useCallback } from "react";
import { useInView } from "react-intersection-observer";

interface UseInfiniteScrollOptions {
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void | Promise<unknown>;
  enabled?: boolean;
  root?: Element | null;
  rootMargin?: string;
  readyDelay?: number;
}

export function useInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  enabled = true,
  root = null,
  rootMargin = "300px",
  readyDelay = 100,
}: UseInfiniteScrollOptions) {
  const [isReady, setIsReady] = useState(false);

  const { ref, inView } = useInView({
    threshold: 0,
    root,
    rootMargin,
    skip: !enabled || !isReady,
  });

  // Enable observer after a short delay to skip initial mount
  useEffect(() => {
    if (!enabled) {
      setIsReady(false);
      return;
    }

    const timer = setTimeout(() => setIsReady(true), readyDelay);
    return () => clearTimeout(timer);
  }, [enabled, readyDelay]);

  // Fetch when scrolled into view
  useEffect(() => {
    if (enabled && inView && hasNextPage && !isFetchingNextPage && isReady) {
      void fetchNextPage();
    }
  }, [
    enabled,
    inView,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isReady,
  ]);

  return { ref, inView, isReady };
}
