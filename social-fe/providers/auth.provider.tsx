"use client";
import React, { useEffect, useCallback } from "react";
import { AuthService } from "@/app/services/auth.service";
import { useAuthStore } from "@/app/store/use-auth.store";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { setAuth, clearAuth } = useAuthStore();

  const performRefresh = useCallback(async () => {
    try {
      const res = await AuthService.refresh();

      if (!res.accessToken || !res.user.username) {
        clearAuth();
        return;
      }
      setAuth(res.accessToken, res.user.username, res.user.email ?? "");
    } catch {
      clearAuth();
    }
  }, [setAuth, clearAuth]);

  useEffect(() => {
    void performRefresh();

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        useAuthStore.getState().isAuthenticated
      ) {
        void performRefresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [performRefresh]);

  return <>{children}</>;
};
