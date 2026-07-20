import { User } from "./user.interface";
import { Feed } from "./feed.interface";

export interface CreateListData {
  name: string;
  description?: string;
  listFile?: File;
}

export interface UpdateList extends CreateListData {
  listId: string;
}

export interface List {
  id: string;
  name: string;
  description: string;
  listPhoto: string;
  createdAt?: string;
  userId?: string;
  user: User;
  posts?: Feed[];
}
