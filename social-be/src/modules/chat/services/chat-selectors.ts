export const CHAT_USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  verified: true,
} as const;

export const CHAT_MESSAGE_SELECT = {
  id: true,
  conversationId: true,
  senderId: true,
  content: true,
  type: true,
  status: true,
  replyToId: true,
  isDeleted: true,
  isEdited: true,
  editedAt: true,
  createdAt: true,
  sender: { select: CHAT_USER_SELECT },
  attachments: {
    select: {
      id: true,
      url: true,
      thumbnailUrl: true,
      fileName: true,
      fileSize: true,
      mimeType: true,
      width: true,
      height: true,
    },
  },
  reactions: {
    select: {
      id: true,
      emoji: true,
      userId: true,
      user: { select: CHAT_USER_SELECT },
    },
  },
  replyTo: {
    select: {
      id: true,
      content: true,
      senderId: true,
      sender: { select: CHAT_USER_SELECT },
    },
  },
} as const;

export const CHAT_CONVERSATION_SELECT = {
  id: true,
  type: true,
  name: true,
  avatar: true,
  lastMessageAt: true,
  messageCount: true,
  createdAt: true,
  updatedAt: true,
  participants: {
    where: { leftAt: null },
    select: {
      id: true,
      conversationId: true,
      userId: true,
      role: true,
      nickname: true,
      unreadCount: true,
      lastReadMessageId: true,
      isPinned: true,
      isMuted: true,
      user: { select: CHAT_USER_SELECT },
    },
  },
  lastMessage: {
    select: CHAT_MESSAGE_SELECT,
  },
} as const;

export type ConversationCursor = {
  lastMessageAt: string | null;
  createdAt: string;
  id: string;
};

export type MessageCursor = {
  createdAt: string;
  id: string;
};

export const encodeChatCursor = (cursor: ConversationCursor | MessageCursor) =>
  Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');

export const decodeChatCursor = <T>(cursor?: string): T | null => {
  if (!cursor) return null;

  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
};
