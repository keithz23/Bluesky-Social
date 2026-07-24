import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: "auth-storage",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        id: state.id,
        username: state.username,
        email: state.email,
        isAuthenticated: state.isAuthenticated,
        roles: state.roles,
        permissions: state.permissions,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<AuthState>),
      }),
    },
  ),
);
