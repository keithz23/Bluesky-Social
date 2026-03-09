export type ReplyType = "anyone" | "nobody" | "custom";

export interface ReplyPrivacyState {
  type: ReplyType;
  allowQuote: boolean;
  custom?: {
    followers: boolean;
    following: boolean;
    mentioned: boolean;
    lists?: string[];
  };
}

export interface CreatePostPayload {
  content?: string;
  replyPrivacy: ReplyPrivacyState;
  images?: File[];
  gifUrl?: string;
}

export interface CreateReplyDto {
  content?: string;
  images?: File[];
  gifUrl?: string;
}

export interface UpdatePostPayload extends CreatePostPayload {
  id: string;
}

export interface PostMedia {
  id: string;
  mediaUrl: string;
  mediaType: string;
  altText: string;
}
