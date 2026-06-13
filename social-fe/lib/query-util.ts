import { QueryClient } from "@tanstack/react-query";

export const updatePostInCaches = (
  qc: QueryClient,
  cacheKeys: any[][],
  postId: string,
  updater: (post: any) => any,
) => {
  cacheKeys.forEach((queryKey) => {
    qc.setQueryData(queryKey, (old: any) =>
      updatePostValue(old, postId, updater),
    );
  });
};

export const updateBookmarkCache = (
  qc: QueryClient,
  postId: string,
  updater: (post: any) => any,
) => {
  qc.setQueryData(["bookmarks"], (old: any) => {
    if (!old) return old;
    return old.map((b: any) =>
      b.post.id === postId ? { ...b, post: updater(b.post) } : b,
    );
  });
};

const updatePostValue = (
  value: any,
  postId: string,
  updater: (post: any) => any,
): any => {
  if (!value) return value;

  if (Array.isArray(value)) {
    return value.map((item) => updatePostValue(item, postId, updater));
  }

  if (typeof value !== "object") return value;

  const next = value.id === postId ? updater(value) : value;

  return {
    ...next,
    ...(next.post && {
      post: updatePostValue(next.post, postId, updater),
    }),
    ...(next.posts && {
      posts: next.posts.map((post: any) =>
        updatePostValue(post, postId, updater),
      ),
    }),
    ...(next.replies && {
      replies: next.replies.map((reply: any) =>
        updatePostValue(reply, postId, updater),
      ),
    }),
    ...(next.parentChain && {
      parentChain: next.parentChain.map((post: any) =>
        updatePostValue(post, postId, updater),
      ),
    }),
    ...(next.pages && {
      pages: next.pages.map((page: any) =>
        updatePostValue(page, postId, updater),
      ),
    }),
  };
};
