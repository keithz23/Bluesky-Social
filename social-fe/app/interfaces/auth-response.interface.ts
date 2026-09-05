import type { CurrentUserResponse } from "./user-response.interface";

export type { CurrentUserResponse } from "./user-response.interface";

export interface RoleResponse {
  id: string;
  name: string;
  level: number;
  permissions: string[];
}

export interface AuthSessionResponse {
  accessToken: string;
  refreshToken: string;
  user: CurrentUserResponse;
  roles: RoleResponse[];
}

export interface CurrentSessionResponse {
  user: CurrentUserResponse;
  roles: RoleResponse[];
}

export interface RegisterResponse {
  id: string;
  username: string;
  email: string;
  displayName: string;
  verified: boolean;
  createdAt: string;
}

export type Login2FAChallengeResponse = {
  requires2FA: true;
  challengeId: string;
  methods: Array<"totp" | "recovery_code">;
  maskedEmail: string;
};

export type LoginResponse = AuthSessionResponse | Login2FAChallengeResponse;
