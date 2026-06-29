"use client";
import ListFormDialog from "@/app/components/dialog/list-dialog";
import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

export default function ListsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const isRootPage = pathname === "/lists";

  return (
    <div className="flex min-h-[calc(100dvh-7rem)] w-full flex-col bg-white pb-20 lg:min-h-[calc(100dvh-3.5rem)]">
      {isRootPage && (
        <div className="sticky top-14 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100 flex items-center justify-between p-4 lg:top-14">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-900" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 ml-4 tracking-tight">
              Lists
            </h1>
          </div>

          <ListFormDialog />
        </div>
      )}

      {children}
    </div>
  );
}
