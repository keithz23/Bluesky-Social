"use client"
import { ArrowLeft, MoreHorizontal, SquarePen } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const tabs = [
    "Replies",
    "Media",
    "Videos",
    "Likes",
    "Feeds",
    "Starter Packs",
    "Lists",
  ];

  return (
    <div className="flex flex-col w-full bg-white min-h-screen pb-20">
      {/* --- COVER & AVATAR SECTION --- */}
      <div className="h-32 bg-slate-50 relative">
        {/* Back button */}
        <Link
          href="/"
          className="absolute top-4 left-4 p-1.5 bg-black/20 hover:bg-black/30 rounded-full transition text-white z-10 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {/* Avatar */}
        <div className="absolute -bottom-10 left-4 w-21 h-21 rounded-full border-4 border-white bg-[#FF4F5A] flex items-center justify-center text-[40px] text-white font-bold shadow-sm z-10">
          @
        </div>
      </div>

      {/* --- ACTION BUTTONS --- */}
      <div className="flex justify-end gap-2 px-4 pt-3">
        <button className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-sm px-4 py-1.5 rounded-full transition cursor-pointer">
          Edit Profile
        </button>
        <button className="bg-gray-100 hover:bg-gray-200 text-gray-900 p-1.5 rounded-full transition cursor-pointer">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* --- PROFILE INFO --- */}
      <div className="px-4 mt-2 mb-4">
        <h1 className="text-[22px] font-extrabold text-gray-900 leading-tight">
          keithz24.bsky.social
        </h1>
        <p className="text-gray-500 text-[15px]">@keithz24.bsky.social</p>

        {/* Stats */}
        <div className="flex gap-4 mt-3 text-[15px] text-gray-500">
          <div>
            <span className="font-bold text-gray-900">0</span> followers
          </div>
          <div>
            <span className="font-bold text-gray-900">1</span> following
          </div>
          <div>
            <span className="font-bold text-gray-900">0</span> posts
          </div>
        </div>
      </div>

      {/* --- TABS NAVIGATION --- */}
      <div className="flex overflow-x-auto border-b border-gray-200 hide-scrollbar">
        <button className="px-4 py-3 text-[15px] font-bold text-gray-900 border-b-[3px] border-blue-600 whitespace-nowrap cursor-pointer">
          Posts
        </button>

        {tabs.map((tab) => (
          <button
            key={tab}
            className="px-4 py-3 text-[15px] font-bold text-gray-500 hover:bg-gray-100 transition whitespace-nowrap cursor-pointer"
          >
            {tab}
          </button>
        ))}
      </div>

      {/* --- EMPTY STATE CONTENT --- */}
      <div className="flex flex-col items-center justify-center mt-16 px-4">
        <div className="mb-4">
          <SquarePen className="w-12 h-12 text-gray-600" strokeWidth={1} />
        </div>
        <p className="text-gray-900 font-bold mb-4">No posts yet</p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[15px] px-6 py-2.5 rounded-full transition shadow-sm cursor-pointer">
          Write a post
        </button>
      </div>
    </div>
  );
}
