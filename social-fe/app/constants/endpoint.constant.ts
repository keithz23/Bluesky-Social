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
    DELETE_POST: (id: string) => `/posts/delete-post/${id}`,
    GET_BY_USERNAME: (username: string) => `/posts/users/${username}`,
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
    FOLLOWING_LISTS: (params: {
      username: string;
      cursor?: string;
      limit?: number;
    }) => {
      const query = new URLSearchParams();

      query.set("username", params.username);

      if (params.cursor) query.set("cursor", params.cursor);
      if (params.limit) query.set("limit", String(params.limit));

      return `/follows/following-lists?${query.toString()}`;
    },
    FOLLOWER_LISTS: (params: {
      username: string;
      cursor?: string;
      limit?: number;
    }) => {
      const query = new URLSearchParams();

      query.set("username", params.username);

      if (params.cursor) query.set("cursor", params.cursor);
      if (params.limit) query.set("limit", String(params.limit));

      return `/follows/follower-lists?${query.toString()}`;
    },
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
