"use client";
import React, { useEffect, useCallback } from "react";
import { AuthService } from "@/app/services/auth.service";
import { useAuthStore } from "@/app/store/use-auth.store";
import { useQueryClient } from "@tanstack/react-query";
import { isAuthLogoutLocked } from "@/app/utils/auth-cache.util";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const { setAuth, clearAuth } = useAuthStore();

  const performRefresh = useCallback(async () => {
    try {
      if (isAuthLogoutLocked()) {
        clearAuth();
        queryClient.setQueryData(["me"], null);
        return;
      }

      const res = await AuthService.refresh();

      if (!res.accessToken || !res.user.username) {
        clearAuth();
        queryClient.setQueryData(["me"], null);
        return;
      }

      setAuth(res.accessToken, res.user.username, res.user.email ?? "");
      queryClient.setQueryData(["me"], res.user);
    } catch {
      clearAuth();
      queryClient.setQueryData(["me"], null);
    }
  }, [setAuth, clearAuth, queryClient]);

  useEffect(() => {
    void performRefresh();

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void performRefresh();
      }
    };

    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("focus", refreshWhenVisible);
    window.addEventListener("pageshow", refreshWhenVisible);

    return () => {
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("focus", refreshWhenVisible);
      window.removeEventListener("pageshow", refreshWhenVisible);
    };
  }, [performRefresh]);

  return <>{children}</>;
};
