"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen w-full flex-col bg-white pb-20">
      <div className="sticky top-0 z-40 flex h-12 items-center border-b border-gray-200 bg-white px-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="-ml-2 cursor-pointer rounded-full p-2 transition hover:bg-gray-100"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <h1 className="ml-3 text-[19px] font-bold leading-none text-black">
          Settings
        </h1>
      </div>

      {children}
    </div>
  );
}
