export const RATE_LIMITS = {
  LOGIN: {
    ttl: 60 * 15, // 15 minutes
    limit: 5, // 5 attempts
  },
  REGISTER: {
    ttl: 60 * 60, // 1 hour
    limit: 3, // 3 attempts
  },
  POST_CREATE: {
    ttl: 60, // 1 minute
    limit: 10, // 10 posts
  },
  COMMENT_CREATE: {
    ttl: 60, // 1 minute
    limit: 20, // 20 comments
  },
  FRIEND_REQUEST: {
    ttl: 60 * 60, // 1 hour
    limit: 30, // 30 requests
  },
  FILE_UPLOAD: {
    ttl: 60 * 60, // 1 hour
    limit: 50, // 50 uploads
  },
  API_GENERAL: {
    ttl: 60, // 1 minute
    limit: 100, // 100 requests
  },
};
