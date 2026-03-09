"use client";
import NewListDialog from "@/app/components/dialog/new-list-dialog";
import { ArrowLeft, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ListsPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col w-full bg-white min-h-screen pb-20">
      {/* --- HEADER --- */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 flex items-center justify-between p-4">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 ml-4">Lists</h1>
        </div>

        <NewListDialog />
      </div>

      {/* --- EMPTY STATE --- */}
      <div className="flex flex-col items-center justify-center mt-32 px-4">
        <div className="mb-6 text-slate-700">
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="8" cy="9" r="1.5" />
            <path d="M12 9h5" />
            <circle cx="8" cy="15" r="1.5" />
            <path d="M12 15h5" />
          </svg>
        </div>

        {/* Text */}
        <p className="text-[#4B5563] text-[15px] text-center leading-snug">
          Lists allow you to see content
          <br />
          from your favorite people.
        </p>
      </div>
    </div>
  );
}
