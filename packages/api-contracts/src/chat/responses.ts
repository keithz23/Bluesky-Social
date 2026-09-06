import type { IsoDateTimeString } from "../common/api-envelope";
import type { ConversationType, MessageType } from "./requests";
import type { UserSummaryResponse } from "../users/responses";

export type MessageStatus = "SENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED";
export type ParticipantRole = "MEMBER" | "ADMIN" | "OWNER";

export interface ConversationResponse {
  id: string;
  type: ConversationType;
  name: string | null;
  avatar: string | null;
  lastMessageAt: IsoDateTimeString | null;
  messageCount: number;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
  participants: ConversationParticipantResponse[];
  lastMessage: MessageResponse | null;
}

export interface ConversationParticipantResponse {
  id: string;
  conversationId: string;
  userId: string;
  role: ParticipantRole;
  nickname: string | null;
  unreadCount: number;
  lastReadMessageId: string | null;
  isPinned: boolean;
  isMuted: boolean;
  user: UserSummaryResponse;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  type: MessageType;
  status: MessageStatus;
  replyToId: string | null;
  replyTo: MessageResponse | null;
  isDeleted: boolean;
  isEdited: boolean;
  editedAt: IsoDateTimeString | null;
  createdAt: IsoDateTimeString;
  sender: UserSummaryResponse;
  attachments: MessageAttachmentResponse[];
  reactions: MessageReactionResponse[];
}

export interface MessageAttachmentResponse {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  width: number | null;
  height: number | null;
}

export interface MessageReactionResponse {
  id: string;
  emoji: string;
  userId: string;
  user: UserSummaryResponse;
}

export interface ConversationsPageResponse {
  conversations: ConversationResponse[];
  nextCursor: string | null;
}

export interface MessagesPageResponse {
  messages: MessageResponse[];
  nextCursor: string | null;
}
