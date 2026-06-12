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
    REQUEST_UPDATE_PASSWORD: "/auth/request-update-password",
    CHANGE_PASSWORD: "/auth/change-password",
    CHANGE_USERNAME: "/auth/change-username",
    CHANGE_BIRTHDAY: "/auth/change-birthday",
    REQUEST_UPDATE_EMAIL: "/auth/request-update-email",
    UPDATE_EMAIL: "/auth/update-email",
    SOCKET_TOKEN: "/auth/socket-token",
  },

  POSTS: {
    CREATE_POST: "/posts/create-post",
    UPDATE_POST: (id: string) => `/posts/update-post/${id}`,
    DELETE_POST: (id: string) => `/posts/delete-post/${id}`,
    GET_BY_USERNAME: (username: string) => `/posts/users/${username}`,
    GET_BY_ID: (postId: string) => `/posts/post-detail/${postId}`,
    SEARCH: (params: { q: string; cursor?: string; limit?: number }) => {
      const query = new URLSearchParams();
      query.set("q", params.q);
      if (params.cursor) query.set("cursor", params.cursor);
      if (params.limit) query.set("limit", String(params.limit));
      return `/posts/search?${query.toString()}`;
    },

    CREATE_REPLY: (postId: string) => `/posts/${postId}/replies`,
    GET_REPLIES: (postId: string) => `/posts/${postId}/replies`,
  },

  FEED: {
    GET_FEED: (params?: { cursor?: string; limit?: number; seed?: string }) => {
      const query = new URLSearchParams();
      if (params?.cursor) query.set("cursor", params.cursor);
      if (params?.limit) query.set("limit", String(params.limit));
      if (params?.seed) query.set("seed", params.seed);
      const qs = query.toString();
      return qs ? `/feed?${qs}` : "/feed";
    },
  },

  NOTIFICATIONS: {
    GET_NOTIFICATIONS: (params: {
      cursor?: string;
      limit?: number;
      filter?: "all" | "mention";
    }) => {
      const query = new URLSearchParams();
      if (params?.cursor) query.set("cursor", params.cursor);
      if (params?.limit) query.set("limit", String(params.limit));
      if (params?.filter) query.set("filter", params.filter);
      const qs = query.toString();
      return qs
        ? `/notifications/get-notifications?${qs}`
        : "/notifications/get-notifications";
    },
    UNREAD_COUNT: "/notifications/unread-count",
    MARK_READ: (notificationId: string) =>
      `/notifications/${notificationId}/read`,
    MARK_ALL_READ: "/notifications/read-all",
  },

  FOLLOWS: {
    FOLLOWING_LISTS: (params: {
      username: string;
      cursor?: string;
      limit?: number;
      listId?: string;
    }) => {
      const query = new URLSearchParams();

      query.set("username", params.username);

      if (params.cursor) query.set("cursor", params.cursor);
      if (params.limit) query.set("limit", String(params.limit));
      if (params.listId) query.set("listId", params.listId);

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
    SEARCH: (q: string, limit: number, listId?: string) => {
      const params = new URLSearchParams();
      params.set("q", q);
      params.set("limit", String(limit));
      if (listId) params.set("listId", listId);
      return `/users/search?${params.toString()}`;
    },
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

  CHAT: {
    GET_CONVERSATIONS: (params?: { cursor?: string; limit?: number }) => {
      const query = new URLSearchParams();
      if (params?.cursor) query.set("cursor", params.cursor);
      if (params?.limit) query.set("limit", String(params.limit));
      const qs = query.toString();
      return qs ? `/conversations?${qs}` : "/conversations";
    },
    CREATE_CONVERSATION: "/conversations",
    GET_CONVERSATION: (id: string) => `/conversations/${id}`,
    DELETE_CONVERSATION: (id: string) => `/conversations/${id}`,
    UPDATE_CONVERSATION: (id: string) => `/conversations/${id}`,
    GET_MESSAGES: (
      id: string,
      params?: { cursor?: string; limit?: number },
    ) => {
      const query = new URLSearchParams();
      if (params?.cursor) query.set("cursor", params.cursor);
      if (params?.limit) query.set("limit", String(params.limit));
      const qs = query.toString();
      return qs
        ? `/conversations/${id}/messages?${qs}`
        : `/conversations/${id}/messages`;
    },
    SEND_MESSAGE: (id: string) => `/conversations/${id}/messages`,
  },

  LISTS: {
    CREATE_LIST: `/lists/create-list`,
    UPDATE_LIST: `/lists/update-list`,
    DELETE_LIST: (id: string) => `/lists/delete-list/${id}`,
    GET_LISTS: (params?: {
      cursor?: string;
      limit?: number;
      username?: string;
    }) => {
      const query = new URLSearchParams();
      if (params?.cursor) query.set("cursor", params.cursor);
      if (params?.limit) query.set("limit", String(params.limit));
      if (params?.username) query.set("username", params.username);
      const qs = query.toString();
      return qs ? `/lists/get-lists?${qs}` : "/lists/get-lists";
    },
    GET_LIST_BY_ID: (id: string) => `lists/get-list-by-id/${id}`,
  },
  LISTS_MEMBER: {
    ADD_MEMBER: (listId: string, participantId: string) =>
      `/lists-member/${listId}/members/${participantId}`,
    REMOVE_MEMBER: (listId: string, userIdToRemove: string) =>
      `/lists-member/${listId}/members/${userIdToRemove}`,
    GET_LIST_MEMBER: (
      listId: string,
      params?: { cursor?: string; limit?: number },
    ) => {
      const query = new URLSearchParams();
      if (params?.cursor) query.set("cursor", params.cursor);
      if (params?.limit) query.set("limit", String(params.limit));
      const qs = query.toString();
      return qs
        ? `/lists-member/${listId}/get-list-members?${qs}`
        : `lists-member/${listId}/members`;
    },
  },

  MODERATION: {
    BLOCK_USER: (userId: string) => `/moderation/blocks/${userId}`,
    UNBLOCK_USER: (userId: string) => `/moderation/blocks/${userId}`,
    MUTE_USER: (userId: string) => `/moderation/mutes/${userId}`,
    UNMUTE_USER: (userId: string) => `/moderation/mutes/${userId}`,
    REPORT_POST: (postId: string) => `/moderation/reports/posts/${postId}`,
  },
};
