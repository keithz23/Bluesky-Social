"use client";

import { useProfile } from "@/app/hooks/use-profile";
import { ArrowLeft, MoreHorizontal, SquarePen, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FollowButton } from "@/app/components/button/follow-button";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { data: profile, isLoading } = useProfile(username);

  const tabs = [
    "Replies",
    "Media",
    "Videos",
    "Likes",
    "Feeds",
    "Starter Packs",
    "Lists",
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col w-full bg-white min-h-screen pb-20 animate-pulse">
        <div className="h-32 bg-gray-200" />
        <div className="flex justify-end gap-2 px-4 pt-3">
          <div className="h-8 w-24 bg-gray-200 rounded-full" />
        </div>
        <div className="px-4 mt-12 flex flex-col gap-2">
          <div className="h-5 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-white min-h-screen pb-20">
      {/* --- COVER & AVATAR --- */}
      <div className="h-32 relative" style={{ backgroundColor: "#f1f5f9" }}>
        {profile?.coverUrl && (
          <img
            src={profile.coverUrl}
            alt="cover"
            className="w-full h-full object-cover"
          />
        )}

        <Link
          href="/"
          className="absolute top-4 left-4 p-1.5 bg-black/20 hover:bg-black/30 rounded-full transition text-white z-10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {/* Avatar */}
        <div className="absolute -bottom-10 left-4 w-21 h-21 rounded-full border-4 border-white bg-[#FF4F5A] flex items-center justify-center text-[40px] text-white font-bold shadow-sm z-10 overflow-hidden">
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.username}
              className="w-full h-full object-cover"
            />
          ) : (
            profile?.username?.charAt(0).toUpperCase()
          )}
        </div>
      </div>

      {/* --- ACTION BUTTONS --- */}
      <div className="flex justify-end gap-2 px-4 pt-3">
        {profile?.isOwner ? (
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-sm px-4 py-1.5 rounded-full transition cursor-pointer">
            Edit Profile
          </button>
        ) : (
          <FollowButton targetUserId={profile?.id} />
        )}
        <button className="bg-gray-100 hover:bg-gray-200 text-gray-900 p-1.5 rounded-full transition cursor-pointer">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* --- PROFILE INFO --- */}
      <div className="px-4 mt-2 mb-4">
        <div className="flex items-center gap-1">
          <h1 className="text-[22px] font-extrabold text-gray-900 leading-tight">
            {profile?.username}
          </h1>
          {profile?.verified && (
            <BadgeCheck className="w-5 h-5 text-blue-500" />
          )}
        </div>
        <p className="text-gray-500 text-[15px]">@{profile?.username}</p>

        {profile?.bio && (
          <p className="mt-2 text-[15px] text-gray-900">{profile.bio}</p>
        )}

        {/* Stats */}
        <div className="flex gap-4 mt-3 text-[15px] text-gray-500">
          <div>
            <span className="font-bold text-gray-900">
              {profile?.followersCount ?? 0}
            </span>{" "}
            followers
          </div>
          <div>
            <span className="font-bold text-gray-900">
              {profile?.followingCount ?? 0}
            </span>{" "}
            following
          </div>
          <div>
            <span className="font-bold text-gray-900">
              {profile?.postsCount ?? 0}
            </span>{" "}
            posts
          </div>
        </div>
      </div>

      {/* --- TABS --- */}
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

      {/* --- EMPTY STATE --- */}
      <div className="flex flex-col items-center justify-center mt-16 px-4">
        <SquarePen className="w-12 h-12 text-gray-600 mb-4" strokeWidth={1} />
        <p className="text-gray-900 font-bold mb-4">No posts yet</p>
        {profile?.isOwner && (
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[15px] px-6 py-2.5 rounded-full transition shadow-sm cursor-pointer">
            Write a post
          </button>
        )}
      </div>
    </div>
  );
}
