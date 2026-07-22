"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import AdminGlobalHeader from "./components/admin-global-header";
import Sidebar from "./components/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        closeMenu();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (pathname === "/admin/login") {
    return <>{children}</>;
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
