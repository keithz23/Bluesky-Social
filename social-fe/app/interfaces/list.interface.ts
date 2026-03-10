import { User } from "./user.interface";

export interface CreateListData {
  name: string;
  description?: string;
  listFile?: File;
}

export interface List {
  name: string;
  description: string;
  listPhoto: string;
  user: User;
}
