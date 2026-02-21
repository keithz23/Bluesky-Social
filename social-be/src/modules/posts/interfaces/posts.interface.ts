export type ReplyType = "anyone" | "nobody" | "custom";

export interface ReplyPrivacy {
  type: ReplyType;
  custom?: {
    followers: boolean;
    following: boolean;
    mentioned: boolean;
    lists?: string[];
  };
  allowQuote: boolean;
}
