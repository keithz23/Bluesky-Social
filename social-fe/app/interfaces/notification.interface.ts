import { User } from "./user.interface";

export interface Notifications {
  id: string;
  userId: string;
  actorId: string | null;
  postId: string | null;
  type: string;
  message?: string | null;
  isRead: boolean;
  createdAt: string;
  actor?: User | null;
  post?: {
    user?: {
      username: string;
    };
  };
}
