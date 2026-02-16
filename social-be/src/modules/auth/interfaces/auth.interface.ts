export interface SignupData {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

export interface SigninData {
  emailOrUsername: string;
  password: string;
}

export interface TokenPayload {
  userId: string;
  username: string;
  email: string;
}

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  accessToken: string;
  refreshToken: string;
}
