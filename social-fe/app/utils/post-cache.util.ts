import type { QueryClient } from "@tanstack/react-query";
import { Feed } from "@/app/interfaces/feed.interface";
import { updateBookmarkCache, updatePostInCaches } from "@/lib/query-util";

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

export const snapshotPostCaches = (qc: QueryClient) => ({
  feed: qc.getQueryData(["feed"]),
  bookmarks: qc.getQueryData(["bookmarks"]),
  reposts: qc.getQueryData(["reposts"]),
  userPosts: qc.getQueriesData({ queryKey: ["userPosts"] }),
  postDetails: qc.getQueriesData({ queryKey: ["post-detail"] })
})

export const rollbackPostCaches = (qc: QueryClient, snapshot: ReturnType<typeof snapshotPostCaches>) => {
  qc.setQueryData(["feed"], snapshot.feed);
  qc.setQueryData(["bookmarks"], snapshot.bookmarks);
  qc.setQueryData(["reposts"], snapshot.reposts);

  snapshot.userPosts.forEach(([key, data]) => qc.setQueryData(key, data));
  snapshot.postDetails.forEach(([key, data]) => qc.setQueryData(key, data));
}

export const updatePostEverywhere = (
  qc: QueryClient,
  postId: string,
  updater: (post: Feed) => Feed,
) => {
  const postDetailKeys = qc.getQueriesData({ queryKey: ["post-detail"] });
  const userPostKeys = qc.getQueriesData({ queryKey: ["userPosts"] });

  updatePostInCaches(
    qc,
    [
      ["feed"],
      ["reposts"],
      ...postDetailKeys.map(([key]) => key as any[]),
      ...userPostKeys.map(([key]) => key as any[]),
    ],
    postId,
    updater,
  );

  updateBookmarkCache(qc, postId, updater);
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
