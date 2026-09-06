import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import type { AxiosProgressEvent } from "axios";
import type {
  ChangeDateOfBirthData,
  ChangeUsernameData,
  UpdateAccountPrivacyData,
  UpdateProfileData,
} from "../interfaces/user.interface";
import type {
  CurrentUserResponse,
  ProfileResponse,
  UserSearchItemResponse,
} from "../interfaces/user-response.interface";

export const UserService = {
  getProfile: async (username: string) => {
    return apiClient.get<ProfileResponse>(
      API_ENDPOINT.USERS.GET_PROFILE(username),
    );
  },

  searchUsers: async (query: string, limit: number = 10, listId?: string) => {
    return apiClient.get<UserSearchItemResponse[]>(
      API_ENDPOINT.USERS.SEARCH(query, limit, listId),
    );
  },

  updateProfile: async (
    data: UpdateProfileData,
    onUploadProgress?: (event: AxiosProgressEvent) => void,
  ) => {
    const formData = new FormData();
    if (data.displayName) formData.append("displayName", data.displayName);
    if (data.bio !== undefined) formData.append("bio", data.bio);
    if (data.avatarFile) formData.append("avatar", data.avatarFile);
    if (data.coverFile) formData.append("cover", data.coverFile);

    return apiClient.patch<CurrentUserResponse>(
      API_ENDPOINT.USERS.UPDATE_PROFILE,
      formData,
      { headers: { "Content-Type": "multipart/form-data" }, onUploadProgress },
    );
  },

  changeUsername: (data: ChangeUsernameData) =>
    apiClient.patch<CurrentUserResponse>(
      API_ENDPOINT.USERS.CHANGE_USERNAME,
      data,
    ),

  changeDateOfBirth: (data: ChangeDateOfBirthData) =>
    apiClient.patch<CurrentUserResponse>(
      API_ENDPOINT.USERS.CHANGE_DATE_OF_BIRTH,
      data,
    ),

  updatePrivacy: (data: UpdateAccountPrivacyData) =>
    apiClient.patch<CurrentUserResponse>(
      API_ENDPOINT.USERS.UPDATE_PRIVACY,
      data,
    ),
};
