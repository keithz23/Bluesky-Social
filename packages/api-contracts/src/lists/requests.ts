export interface CreateListRequest {
  name: string;
  description?: string;
}

export interface CreateListFormData extends CreateListRequest {
  listFile?: File;
}

export interface UpdateListRequest extends CreateListRequest {
  listId: string;
}

export interface UpdateListFormData extends UpdateListRequest {
  listFile?: File;
}
