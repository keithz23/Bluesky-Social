import type { QueryClient } from "@tanstack/react-query";
import { Feed } from "@/app/interfaces/feed.interface";

type InfinitePostsData = {
  pages: Array<{
    posts?: Feed[];
    [key: string]: unknown;
  }>;
  pageParams?: unknown[];
};

const isFeedPost = (value: unknown): value is Feed => {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      "user" in value,
  );
};

export const extractCreatedPost = (payload: unknown): Feed | null => {
  if (isFeedPost(payload)) return payload;

  if (payload && typeof payload === "object" && "post" in payload) {
    const post = (payload as { post?: unknown }).post;
    if (isFeedPost(post)) return post;
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    const data = (payload as { data?: unknown }).data;
    if (isFeedPost(data)) return data;
    if (data && typeof data === "object" && "post" in data) {
      const post = (data as { post?: unknown }).post;
      if (isFeedPost(post)) return post;
    }
  }

  return null;
};

const prependPost = (old: unknown, post: Feed): unknown => {
  const data = old as InfinitePostsData | undefined;
  if (!data?.pages?.length) return old;

  const firstPage = data.pages[0];
  const currentPosts = firstPage.posts ?? [];
  if (currentPosts.some((item) => item.id === post.id)) return old;

  return {
    ...data,
    pages: [
      {
        ...firstPage,
        posts: [post, ...currentPosts],
      },
      ...data.pages.slice(1),
    ],
  };
};

export const prependPostToFeedCache = (qc: QueryClient, post: Feed) => {
  qc.setQueryData(["feed"], (old: unknown) => prependPost(old, post));
};

export const prependPostToUserPostCaches = (qc: QueryClient, post: Feed) => {
  const username = post.user?.username;
  if (!username) return;

  qc.getQueriesData({ queryKey: ["userPosts"] }).forEach(([queryKey]) => {
    const [, cachedUsername, filter] = queryKey as [string, string?, string?];
    if (cachedUsername !== username || filter !== "posts") return;

    qc.setQueryData(queryKey, (old: unknown) => prependPost(old, post));
  });
};
