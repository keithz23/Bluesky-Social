import type { QueryClient } from "@tanstack/react-query";

type ClearAuthStore = () => void;

const AUTH_LOGOUT_LOCK_KEY = "konekt-auth-logout-lock";

const getStorage = () => {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
};

export const setAuthLogoutLock = () => {
  getStorage()?.setItem(AUTH_LOGOUT_LOCK_KEY, String(Date.now()));
  if (typeof document !== "undefined") {
    document.cookie = `${AUTH_LOGOUT_LOCK_KEY}=1; Max-Age=120; Path=/; SameSite=Lax`;
  }
};

export const clearAuthLogoutLock = () => {
  getStorage()?.removeItem(AUTH_LOGOUT_LOCK_KEY);
  if (typeof document !== "undefined") {
    document.cookie = `${AUTH_LOGOUT_LOCK_KEY}=; Max-Age=0; Path=/; SameSite=Lax`;
  }
};

export const isAuthLogoutLocked = () =>
  Boolean(getStorage()?.getItem(AUTH_LOGOUT_LOCK_KEY));

export const clearAuthSessionCache = async (
  queryClient: QueryClient,
  clearAuth: ClearAuthStore,
) => {
  clearAuth();
  await queryClient.cancelQueries();
  queryClient.setQueryData(["me"], null);
  queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] !== "me",
  });
};
