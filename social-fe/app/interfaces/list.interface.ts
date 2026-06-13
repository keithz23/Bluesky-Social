import { User } from "./user.interface";

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
  user: User;
}
