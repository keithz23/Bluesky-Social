"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Pin,
  MoreHorizontal,
  Hash,
  UserPlus,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ListDetailPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"posts" | "people">("posts");

  return (
    <div className="flex flex-col min-h-screen bg-white pb-20">
      <div className="sticky top-0 z-50 h-14 bg-white/90 backdrop-blur-md flex items-center justify-between px-4">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-full font-bold text-[14px] transition-colors">
            <Pin className="w-4 h-4" />
            Pin to home
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-600">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4 py-2 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 shrink-0 bg-[#1185fe] rounded-xl flex items-center justify-center">
            <Users className="w-8 h-8 text-white" strokeWidth={2} />
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
              devandbug
            </h1>
            <p className="text-[15px] text-gray-500 leading-tight mt-0.5">
              List by you
            </p>
          </div>
        </div>

        {/* Mô tả */}
        <p className="text-[15px] text-gray-900 whitespace-pre-wrap">
          devandbug
        </p>
      </div>

      <div className="sticky top-14 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 flex mt-2">
        {/* Tab Posts */}
        <button
          onClick={() => setActiveTab("posts")}
          className="flex-1 flex items-center justify-center h-12 relative hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <span
            className={`text-[15px] ${activeTab === "posts" ? "font-bold text-gray-900" : "font-medium text-gray-500"}`}
          >
            Posts
          </span>
          {activeTab === "posts" && (
            <div className="absolute bottom-0 h-1 w-14 bg-[#1185fe] rounded-t-full" />
          )}
        </button>

        {/* Tab People */}
        <button
          onClick={() => setActiveTab("people")}
          className="flex-1 flex items-center justify-center h-12 relative hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <span
            className={`text-[15px] ${activeTab === "people" ? "font-bold text-gray-900" : "font-medium text-gray-500"}`}
          >
            People
          </span>
          {activeTab === "people" && (
            <div className="absolute bottom-0 h-1 w-14 bg-[#1185fe] rounded-t-full" />
          )}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center pt-24 px-4">
        {activeTab === "posts" ? (
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 text-gray-400">
              <Hash className="w-12 h-12" strokeWidth={1} />
            </div>
            <p className="text-[15px] text-gray-600 mb-6 font-medium">
              This feed is empty.
            </p>
            <button className="flex items-center gap-2 bg-[#1185fe] hover:bg-blue-600 transition-colors text-white font-bold text-[15px] px-6 py-2.5 rounded-full shadow-sm cursor-pointer">
              <UserPlus className="w-4 h-4" strokeWidth={2.5} />
              Start adding people!
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 text-gray-400">
              <Hash className="w-12 h-12" strokeWidth={1} />
            </div>
            <p className="text-[15px] text-gray-600 mb-6 font-medium">
              This feed is empty.
            </p>
            <button className="flex items-center gap-2 bg-[#1185fe] hover:bg-blue-600 transition-colors text-white font-bold text-[15px] px-6 py-2.5 rounded-full shadow-sm cursor-pointer">
              <UserPlus className="w-4 h-4" strokeWidth={2.5} />
              Start adding people!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
