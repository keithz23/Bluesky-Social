export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
}

export interface UpdateProfileFormData extends UpdateProfileRequest {
  avatarFile?: File;
  coverFile?: File;
}

export interface UpdateAccountPrivacyRequest {
  isPrivate: boolean;
}

export interface ChangeUsernameRequest {
  username: string;
}

export interface ChangeDateOfBirthRequest {
  dateOfBirth: string;
}

export interface SearchUsersQueryRequest {
  q?: string;
  limit?: number;
  listId?: string;
}
