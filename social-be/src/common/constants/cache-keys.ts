export const CACHE_KEYS = {
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  USER_POSTS: (userId: string, page: number) => `user:posts:${userId}:${page}`,
  POST_DETAIL: (postId: string) => `post:${postId}`,
  POST_COMMENTS: (postId: string, page: number) =>
    `post:comments:${postId}:${page}`,
  USER_FEED: (userId: string, page: number) => `feed:${userId}:${page}`,
  USER_NOTIFICATIONS: (userId: string) => `notifications:${userId}`,
  TRENDING_POSTS: (page: number) => `trending:posts:${page}`,
  TRENDING_HASHTAGS: () => `trending:hashtags`,
  GROUP_MEMBERS: (groupId: string) => `group:members:${groupId}`,
  ONLINE_USERS: () => `users:online`,
};
