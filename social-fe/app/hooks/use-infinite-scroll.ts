import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";

interface UseInfiniteScrollOptions {
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void | Promise<unknown>;
  enabled?: boolean;
  root?: Element | null;
  rootMargin?: string;
  readyDelay?: number;
  minFetchInterval?: number;
}

export function useInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  enabled = true,
  root = null,
  rootMargin = "1000px",
  readyDelay = 100,
  minFetchInterval = 800,
}: UseInfiniteScrollOptions) {
  const [isReady, setIsReady] = useState(false);
  const lastFetchAtRef = useRef(0);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const clearCooldownTimer = () => {
      if (!cooldownTimerRef.current) return;
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    };

    const canFetch =
      enabled && inView && hasNextPage && !isFetchingNextPage && isReady;

    if (!canFetch) {
      clearCooldownTimer();
      return;
    }

    const runFetch = () => {
      lastFetchAtRef.current = Date.now();
      void fetchNextPage();
    };

    const elapsed = Date.now() - lastFetchAtRef.current;
    const remaining = minFetchInterval - elapsed;

    if (remaining <= 0) {
      clearCooldownTimer();
      runFetch();
      return;
    }

    if (!cooldownTimerRef.current) {
      cooldownTimerRef.current = setTimeout(() => {
        cooldownTimerRef.current = null;
        runFetch();
      }, remaining);
    }

    return clearCooldownTimer;
  }, [
    enabled,
    inView,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isReady,
    minFetchInterval,
  ]);

  return { ref, inView, isReady };
}
