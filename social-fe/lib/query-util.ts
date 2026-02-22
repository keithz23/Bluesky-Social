import { QueryClient } from "@tanstack/react-query";

export const updatePostInCaches = (
  qc: QueryClient,
  cacheKeys: any[][],
  postId: string,
  updater: (post: any) => any,
) => {
  cacheKeys.forEach((queryKey) => {
    qc.setQueryData(queryKey, (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          posts: page.posts.map((p: any) => (p.id === postId ? updater(p) : p)),
        })),
      };
    });
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
