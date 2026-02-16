export const ERROR_MESSAGES = {
  // Auth
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  USERNAME_ALREADY_EXISTS: 'Username already exists',
  UNAUTHORIZED: 'Unauthorized access',
  TOKEN_EXPIRED: 'Token has expired',
  INVALID_TOKEN: 'Invalid token',

  // User
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User already exists',
  CANNOT_FOLLOW_YOURSELF: 'You cannot follow yourself',

  // Post
  POST_NOT_FOUND: 'Post not found',
  CANNOT_EDIT_POST: 'You cannot edit this post',
  CANNOT_DELETE_POST: 'You cannot delete this post',

  // Comment
  COMMENT_NOT_FOUND: 'Comment not found',
  CANNOT_EDIT_COMMENT: 'You cannot edit this comment',
  CANNOT_DELETE_COMMENT: 'You cannot delete this comment',

  // Friendship
  FRIENDSHIP_REQUEST_NOT_FOUND: 'Friend request not found',
  ALREADY_FRIENDS: 'Already friends with this user',
  FRIENDSHIP_REQUEST_PENDING: 'Friend request already pending',
  CANNOT_SEND_REQUEST_TO_YOURSELF: 'Cannot send friend request to yourself',

  // Media
  FILE_TOO_LARGE: 'File size exceeds maximum limit',
  INVALID_FILE_TYPE: 'Invalid file type',
  FILE_UPLOAD_FAILED: 'File upload failed',

  // Group
  GROUP_NOT_FOUND: 'Group not found',
  NOT_GROUP_MEMBER: 'You are not a member of this group',
  ALREADY_GROUP_MEMBER: 'Already a member of this group',

  // General
  VALIDATION_FAILED: 'Validation failed',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  RESOURCE_NOT_FOUND: 'Resource not found',
  ACCESS_DENIED: 'Access denied',
};
