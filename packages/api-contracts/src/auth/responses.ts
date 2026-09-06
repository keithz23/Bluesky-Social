import type { IsoDateTimeString } from "../common/api-envelope";
import type { CurrentUserResponse } from "../users/responses";

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
  createdAt: IsoDateTimeString;
}

export interface Login2FAChallengeResponse {
  requires2FA: true;
  challengeId: string;
  methods: Array<"totp" | "recovery_code">;
  maskedEmail: string;
}

export type LoginResponse = AuthSessionResponse | Login2FAChallengeResponse;

export interface SuccessResponse {
  message: string;
}

export interface RequestPasswordResetResponse extends SuccessResponse {
  canResetPassword?: boolean;
}

export interface Enable2FAResponse {
  recoveryCodes?: string[];
}

export interface Setup2FAResponse {
  secret: string;
  qrCodeDataUrl: string;
}

export interface SocketTokenResponse {
  token: string;
}
