"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Loading from "../components/loading";
import { useAuth } from "../hooks/use-auth";
import { isAuthLogoutLocked } from "../utils/auth-cache.util";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoadingProfile } = useAuth();
  const isLoggingOut = isAuthLogoutLocked();

  useEffect(() => {
    if (isAuthenticated && !isLoggingOut) {
      router.replace("/");
    }
  }, [router, isAuthenticated, isLoggingOut]);

  if (isLoadingProfile || (isAuthenticated && !isLoggingOut)) {
    return <Loading />;
  }

  return <>{children}</>;
}
