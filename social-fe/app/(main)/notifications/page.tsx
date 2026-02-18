"use client";
import { Settings, Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="flex flex-col w-full bg-white min-h-screen pb-20">
      {/* --- HEADER --- */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          <button className="p-2 -mr-2 hover:bg-gray-100 rounded-full transition cursor-pointer">
            <Settings className="w-5 h-5 text-[#4B5563]" />
          </button>
        </div>

        <div className="flex w-full border-b border-gray-200">
          <button className="flex-1 pb-3 pt-1 text-[15px] font-bold text-gray-900 border-b-[3px] border-blue-600 transition cursor-pointer">
            All
          </button>

          <button className="flex-1 pb-3 pt-1 text-[15px] font-bold text-gray-500 border-b-[3px] border-transparent hover:bg-gray-50 transition cursor-pointer">
            Mentions
          </button>
        </div>
      </div>

      {/* --- EMPTY STATE --- */}
      <div className="flex flex-col items-center justify-center mt-32 px-4">
        <div className="mb-4 text-[#334155]">
          <Bell className="w-10.5 h-10.5" strokeWidth={1.5} />
        </div>

        {/* Text */}
        <p className="text-[#475569] text-[15px] font-medium">
          No notifications yet!
        </p>
      </div>
    </div>
  );
}
