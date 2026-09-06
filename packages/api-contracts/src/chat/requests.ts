export type ConversationType = "DIRECT" | "GROUP" | "CHANNEL";
export type MessageType =
  | "TEXT"
  | "IMAGE"
  | "VIDEO"
  | "AUDIO"
  | "FILE"
  | "STICKER"
  | "SYSTEM";

export interface CreateConversationRequest {
  type: Extract<ConversationType, "DIRECT" | "GROUP">;
  participantIds: string[];
  name?: string;
}

export interface UpdateConversationRequest {
  name?: string;
  avatar?: string;
}

export interface SendMessageRequest {
  content: string;
  type?: MessageType;
  replyToId?: string;
}

export interface MessageQueryRequest {
  cursor?: string;
  limit?: number;
}

export type ConversationQueryRequest = MessageQueryRequest;
