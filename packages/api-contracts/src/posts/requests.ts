export interface PostThemeRequest {
  type: string;
  background: string;
}

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

export interface CreatePostRequest {
  content?: string;
  replyPrivacy: ReplyPrivacyState;
  gifUrl?: string;
  postTheme?: PostThemeRequest;
}

export interface CreatePostFormData extends CreatePostRequest {
  images?: File[];
}

export interface CreateReplyRequest {
  content?: string;
  gifUrl?: string;
}

export interface CreateReplyFormData extends CreateReplyRequest {
  images?: File[];
}

export interface UpdatePostRequest extends Partial<CreatePostRequest> {
  keepMediaIds?: string[];
}

export interface UpdatePostFormData extends Partial<CreatePostFormData> {
  id: string;
  keepMediaIds?: string[];
}
