"use client";

import { useProfile } from "@/app/hooks/use-profile";
import { ArrowLeft, MoreHorizontal, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { FollowButton } from "@/app/components/button/follow-button";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { username } = useParams<{ username: string }>();
  const { data: profile, isLoading } = useProfile(username);
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { name: "Posts", href: `/profile/${username}` },
    { name: "Replies", href: `/profile/${username}/replies` },
    { name: "Media", href: `/profile/${username}/media` },
    { name: "Videos", href: `/profile/${username}/videos` },
    { name: "Likes", href: `/profile/${username}/likes` },
    { name: "Feeds", href: `/profile/${username}/feeds` },
    { name: "Starter Packs", href: `/profile/${username}/starter-packs` },
    { name: "Lists", href: `/profile/${username}/lists` },
  ];

  const isActiveTab = (href: string) => {
    if (href === `/profile/${username}`) {
      return pathname === `/profile/${username}`;
    }
    return pathname.startsWith(href);
  };

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

  if (
    pathname === `/profile/${username}/follows` ||
    pathname === `/profile/${username}/followers`
  ) {
    return children;
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

        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 p-1.5 bg-black/20 hover:bg-black/30 rounded-full transition text-white z-10 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

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
          <Link href={`/profile/${username}/followers`}>
            <div className="hover:underline">
              <span className="font-bold text-gray-900">
                {profile?.followersCount ?? 0}
              </span>{" "}
              followers
            </div>
          </Link>

          <Link href={`/profile/${username}/follows`}>
            <div className="hover:underline">
              <span className="font-bold text-gray-900">
                {profile?.followingCount ?? 0}
              </span>{" "}
              following
            </div>
          </Link>
          <div>
            <span className="font-bold text-gray-900">
              {profile?.postsCount ?? 0}
            </span>{" "}
            posts
          </div>
        </div>
      </div>

      {/* --- TABS --- */}
      <div className="flex overflow-x-auto border-b border-gray-200 no-scrollbar sticky top-0 z-20 bg-white/95 backdrop-blur-sm">
        {tabs.map((tab) => (
          <Link
            key={tab.name}
            href={tab.href}
            className={`px-4 py-3 text-[15px] font-bold whitespace-nowrap cursor-pointer transition
        ${
          isActiveTab(tab.href)
            ? "text-gray-900 border-b-[3px] border-blue-600"
            : "text-gray-500 hover:bg-gray-100"
        }`}
          >
            {tab.name}
          </Link>
        ))}
      </div>

      {children}
    </div>
  );
}
