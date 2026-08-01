import { create } from "zustand";

interface AuthState {
  accessToken: string | null;
  id: string | null;
  username: string | null;
  email: string | null;
  isAuthenticated: boolean;
  roles: string[];
  permissions: string[];
  setAuth: (
    token: string,
    id: string,
    username: string,
    email: string,
    roles: string[],
    permissions: string[],
  ) => void;
  clearAuth: () => void;
}

// Auth state is intentionally memory-only. Permissions are rehydrated from
// the server's refresh response, never trusted from browser storage.
export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  id: null,
  username: null,
  email: null,
  isAuthenticated: false,
  roles: [],
  permissions: [],

  setAuth: (token, id, username, email, roles, permissions) =>
    set({
      accessToken: token,
      id,
      username,
      email,
      isAuthenticated: true,
      roles,
      permissions,
    }),

  clearAuth: () =>
    set({
      accessToken: null,
      id: null,
      username: null,
      email: null,
      isAuthenticated: false,
      roles: [],
      permissions: [],
    }),
}));
