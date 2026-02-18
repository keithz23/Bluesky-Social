"use client";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

export default function ListsPage() {
  return (
    <div className="flex flex-col w-full bg-white min-h-screen pb-20">
      {/* --- HEADER --- */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 flex items-center justify-between p-4">
        <div className="flex items-center">
          <Link
            href="/"
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 ml-4">Lists</h1>
        </div>

        <button className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[15px] px-4 py-1.5 rounded-full transition cursor-pointer">
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          New
        </button>
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
