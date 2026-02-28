import { User } from "./user.interface";

export interface Notifications {
  id: string;
  userId: string;
  actorId: string;
  postId: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  actor: User;
}
