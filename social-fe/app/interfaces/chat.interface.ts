import { User } from "./user.interface";

export type ConversationType = "DIRECT" | "GROUP" | "CHANNEL";
export type MessageType =
  | "TEXT"
  | "IMAGE"
  | "VIDEO"
  | "AUDIO"
  | "FILE"
  | "STICKER"
  | "SYSTEM";
export type MessageStatus = "SENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED";
export type ParticipantRole = "MEMBER" | "ADMIN" | "OWNER";

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  avatar: string | null;
  lastMessageAt: string | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  participants: ConversationParticipant[];
  lastMessage: Message | null;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  role: ParticipantRole;
  nickname: string | null;
  unreadCount: number;
  lastReadMessageId: string | null;
  isPinned: boolean;
  isMuted: boolean;
  user: User;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  type: MessageType;
  status: MessageStatus;
  replyToId: string | null;
  replyTo: Message | null;
  isDeleted: boolean;
  isEdited: boolean;
  editedAt: string | null;
  createdAt: string;
  sender: User;
  attachments: MessageAttachment[];
  reactions: MessageReaction[];
}

export interface MessageAttachment {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  width: number | null;
  height: number | null;
}

export interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
  user: User;
}

export interface ConversationsResponse {
  conversations: Conversation[];
  nextCursor: string | null;
}

export interface MessagesResponse {
  messages: Message[];
  nextCursor: string | null;
}
