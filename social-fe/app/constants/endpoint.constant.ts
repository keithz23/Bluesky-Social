export const API_ENDPOINT = {
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    ME: "/auth/me",
    FORGOT: "/auth/forgot-password",
    RESET: "/auth/reset-password",
    UPDATE_PROFILE: "/auth/update-profile",
    UPDATE_PASSWORD: "/auth/update-password",
  },

  POSTS: {
    CREATE_POST: "/posts/create-post",
    UPDATE_POST: (id: string) => `/posts/update-post/${id}`,
    SOFT_DELETE: "/posts/soft-delete",
    PERMANENT_DELETE: "/posts/permanent-delete",
    FIND_ALL: "/posts/find-all",
    FIND_ONE: (id: string) => `/posts/find-one/${id}`,
  },

  FEED: {
    GET_FEED: (params?: { cursor?: string; limit?: number }) => {
      const query = new URLSearchParams();
      if (params?.cursor) query.set("cursor", params.cursor);
      if (params?.limit) query.set("limit", String(params.limit));
      const qs = query.toString();
      return qs ? `/feed?${qs}` : "/feed";
    },
  },

  FOLLOWS: {
    FOLLOW: (userId: string) => `/follows/${userId}`,
    UNFOLLOW: (userId: string) => `/follows/${userId}`,
    STATUS: (userId: string) => `/follows/status/${userId}`,
    ACCEPT: (senderId: string) => `/follows/requests/${senderId}/accept`,
    DECLINE: (senderId: string) => `/follows/requests/${senderId}/decline`,
  },

  SUGGESTIONS: {
    GET_USERS: (limit?: number) =>
      limit ? `/suggestions/users?limit=${limit}` : "/suggestions/users",
  },

  USERS: {
    GET_PROFILE: (username: string) => `/users/${username}`,
  },

  LIKES: {
    LIKE: (postId: string) => `/likes/${postId}`,
    UNLIKE: (postId: string) => `/likes/${postId}`,
  },

  BOOKMARKS: {
    BOOKMARK: (postId: string) => `/bookmarks/${postId}`,
    UNBOOKMARK: (postId: string) => `/bookmarks/${postId}`,
    GET_BOOKMARKS: "/bookmarks",
  },

  REPOSTS: {
    REPOST: (postId: string) => `/reposts/${postId}`,
    UNREPOST: (postId: string) => `/reposts/${postId}`,
  },
};
