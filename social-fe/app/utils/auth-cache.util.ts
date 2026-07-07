import type { QueryClient } from "@tanstack/react-query";

type ClearAuthStore = () => void;

const AUTH_LOGOUT_LOCK_KEY = "konekt-auth-logout-lock";

const getStorage = () => {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
};

export const setAuthLogoutLock = () => {
  getStorage()?.setItem(AUTH_LOGOUT_LOCK_KEY, String(Date.now()));
};

export const clearAuthLogoutLock = () => {
  getStorage()?.removeItem(AUTH_LOGOUT_LOCK_KEY);
};

export const isAuthLogoutLocked = () =>
  Boolean(getStorage()?.getItem(AUTH_LOGOUT_LOCK_KEY));

export const clearAuthSessionCache = (
  queryClient: QueryClient,
  clearAuth: ClearAuthStore,
) => {
  clearAuth();
  queryClient.setQueryData(["me"], null);
  void queryClient.cancelQueries();
  queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] !== "me",
  });
};
