"use client";

import { LockKeyhole } from "lucide-react";

export default function PrivateProfileState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-600">
        <LockKeyhole className="h-7 w-7" strokeWidth={1.8} />
      </div>
      <h2 className="text-[20px] font-bold text-slate-900">
        This account is private
      </h2>
      <p className="mt-2 max-w-sm text-[15px] leading-5 text-slate-500">
        Follow this account to see their posts, media, likes, lists, and
        followers.
      </p>
    </div>
  );
}
