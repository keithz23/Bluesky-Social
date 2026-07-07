"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Feed } from "@/app/interfaces/feed.interface";
import { DropdownItem } from "@/app/interfaces/dropdown/dropdown.interface";
import PostCard from "@/app/components/card/post-card";

const ESTIMATED_POST_HEIGHT = 260;
const OVERSCAN_PX = 900;

interface VirtualPostListProps {
  posts: Feed[];
  dropdownItems: DropdownItem[];
}

export default function VirtualPostList({
  posts,
  dropdownItems,
}: VirtualPostListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [sizes, setSizes] = useState<Record<string, number>>({});
  const [range, setRange] = useState({ start: 0, end: 20 });
  const uniquePosts = useMemo(() => {
    const seen = new Set<string>();

    return posts.filter((post) => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });
  }, [posts]);

  const offsets = useMemo(() => {
    return uniquePosts.reduce<Array<{ top: number; height: number }>>((items, post) => {
      const top =
        items.length === 0
          ? 0
          : items[items.length - 1].top + items[items.length - 1].height;
      const height = sizes[post.id] ?? ESTIMATED_POST_HEIGHT;
      items.push({ top, height });
      return items;
    }, []);
  }, [uniquePosts, sizes]);

  const totalHeight =
    offsets.length > 0
      ? offsets[offsets.length - 1].top + offsets[offsets.length - 1].height
      : 0;

  const updateRange = useCallback(() => {
    const container = containerRef.current;
    if (!container || uniquePosts.length === 0) {
      setRange({ start: 0, end: 0 });
      return;
    }

    const scrollRoot = container.closest("[data-main-scroll]") as
      | HTMLElement
      | null;
    const containerRect = container.getBoundingClientRect();
    const rootRect = scrollRoot?.getBoundingClientRect();
    const scrollTop = scrollRoot?.scrollTop ?? window.scrollY;
    const viewportHeight = scrollRoot?.clientHeight ?? window.innerHeight;
    const listTop = scrollRoot
      ? containerRect.top - (rootRect?.top ?? 0) + scrollRoot.scrollTop
      : containerRect.top + window.scrollY;
    const viewportTop = scrollTop - listTop - OVERSCAN_PX;
    const viewportBottom = scrollTop - listTop + viewportHeight + OVERSCAN_PX;

    let start = 0;
    while (
      start < offsets.length &&
      offsets[start].top + offsets[start].height < viewportTop
    ) {
      start += 1;
    }

    let end = start;
    while (end < offsets.length && offsets[end].top < viewportBottom) {
      end += 1;
    }

    setRange({
      start: Math.max(0, start - 2),
      end: Math.min(uniquePosts.length, end + 2),
    });
  }, [offsets, uniquePosts.length]);

  useEffect(() => {
    const scrollRoot = containerRef.current?.closest("[data-main-scroll]") as
      | HTMLElement
      | null;
    const scrollTarget = scrollRoot ?? window;

    updateRange();
    scrollTarget.addEventListener("scroll", updateRange, { passive: true });
    window.addEventListener("resize", updateRange);

    return () => {
      scrollTarget.removeEventListener("scroll", updateRange);
      window.removeEventListener("resize", updateRange);
    };
  }, [updateRange]);

  useEffect(() => {
    updateRange();
  }, [uniquePosts.length, updateRange]);

  const measure = useCallback(
    (postId: string) => (node: HTMLDivElement | null) => {
      if (!node) return;

      const updateSize = () => {
        const nextHeight = node.getBoundingClientRect().height;
        if (nextHeight > 0) {
          setSizes((current) => {
            if (Math.abs((current[postId] ?? 0) - nextHeight) <= 1) {
              return current;
            }

            return { ...current, [postId]: nextHeight };
          });
        }
      };

      updateSize();
      const observer = new ResizeObserver(updateSize);
      observer.observe(node);

      return () => observer.disconnect();
    },
    [],
  );

  const visiblePosts = uniquePosts.slice(range.start, range.end);
  const topSpacer = offsets[range.start]?.top ?? 0;
  const renderedHeight = visiblePosts.reduce(
    (sum, post) => sum + (sizes[post.id] ?? ESTIMATED_POST_HEIGHT),
    0,
  );
  const bottomSpacer = Math.max(0, totalHeight - topSpacer - renderedHeight);

  return (
    <div ref={containerRef} className="flex flex-col">
      <div style={{ height: topSpacer }} />

      {visiblePosts.map((post) => (
        <div
          key={post.id}
          ref={measure(post.id)}
          style={{
            contentVisibility: "auto",
            containIntrinsicSize: `${ESTIMATED_POST_HEIGHT}px`,
          }}
        >
          <PostCard post={post} dropdownItems={dropdownItems} />
        </div>
      ))}

      <div style={{ height: bottomSpacer }} />
    </div>
  );
}
