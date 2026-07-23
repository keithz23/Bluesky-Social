"use client";

import React, { useState, useEffect } from "react";
import "../globals.css";
import { usePathname, useRouter } from "next/navigation";
import AdminGlobalHeader from "./components/admin-global-header";
import Sidebar from "./components/sidebar";
import { useAuth } from "../hooks/use-auth";
import Loading from "../components/loading";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, isLoadingProfile } = useAuth();

  const handleMenuToggle = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const isAdminRoute = pathname === "/admin";

  const shouldRedirectToLogin =
    !isLoadingProfile && !isAuthenticated && !isAdminRoute;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        closeMenu();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (shouldRedirectToLogin) {
      router.push("/admin/login");
    }
  }, [shouldRedirectToLogin, router]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (isLoadingProfile || shouldRedirectToLogin) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <AdminGlobalHeader
        isMenuOpen={isMenuOpen}
        onMenuToggle={handleMenuToggle}
      />

      <Sidebar isOpen={isMenuOpen} onClose={closeMenu} />

      <main className="min-h-screen pt-16 lg:pl-72">
        <div className="min-h-[calc(100vh-4rem)] p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
