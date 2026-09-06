import type { IsoDateTimeString } from "../common/api-envelope";
import type { UserSummaryResponse } from "../users/responses";

export interface NotificationResponse {
  id: string;
  userId: string;
  actorId: string | null;
  postId: string | null;
  type: string;
  message?: string | null;
  isRead: boolean;
  createdAt: IsoDateTimeString;
  actor?: UserSummaryResponse | null;
  post?: {
    user?: {
      username: string;
    };
  };
}

export interface NotificationsPageResponse {
  notifications: NotificationResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface UnreadCountResponse {
  count: number;
}
