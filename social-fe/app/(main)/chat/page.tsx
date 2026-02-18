"use client";
import { Settings, Plus } from "lucide-react";

export default function ChatsPage() {
  return (
    <div className="flex flex-col w-full bg-white min-h-screen pb-20">
      {/* --- HEADER --- */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 flex items-center justify-between p-4">
        <h1 className="text-xl font-bold text-gray-900">Chats</h1>

        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-full transition cursor-pointer">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>

          <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[14px] px-4 py-1.5 rounded-full transition cursor-pointer shadow-sm">
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            New chat
          </button>
        </div>
      </div>

      {/* --- EMPTY STATE --- */}
      <div className="flex flex-col items-center justify-center mt-32 px-4">
        <div className="mb-4 text-blue-600">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
            <path d="M8 12h.01" strokeWidth="2.5" />
            <path d="M12 12h.01" strokeWidth="2.5" />
            <path d="M16 12h.01" strokeWidth="2.5" />
          </svg>
        </div>

        <h2 className="text-[20px] font-bold text-gray-900 mb-1.5">
          Nothing here
        </h2>
        <p className="text-gray-500 text-[15px] text-center">
          You have no conversations yet. Start one!
        </p>
      </div>
    </div>
  );
}
