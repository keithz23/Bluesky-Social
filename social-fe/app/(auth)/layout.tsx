"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Loading from "../components/loading";
import { useAuth } from "../hooks/use-auth";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoadingProfile } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
      router.refresh();
    }
  }, [router, isAuthenticated]);

  if (isLoadingProfile || isAuthenticated) {
    return <Loading />;
  }

  return <>{children}</>;
}
