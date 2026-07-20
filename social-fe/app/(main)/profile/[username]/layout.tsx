"use client";

import { useLayoutEffect, useState } from "react";
import { useProfile } from "@/app/hooks/use-profile";
import { ArrowLeft, MoreHorizontal, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { FollowButton } from "@/app/components/button/follow-button";
import EditProfileModal from "@/app/components/dialog/edit-profile-dialog";
import { ProfileHeaderSkeleton } from "@/app/components/skeletons";
import { PhotoProvider, PhotoView } from "react-photo-view";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const { username } = useParams<{ username: string }>();
  const { data: profile, isLoading } = useProfile(username);
  const pathname = usePathname();
  const router = useRouter();
  const profileRoot = `/profile/${username}`;

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, username]);

  const tabs = [
    { name: "Posts", href: profileRoot },
    { name: "Replies", href: `${profileRoot}/replies` },
    { name: "Media", href: `${profileRoot}/media` },
    { name: "Videos", href: `${profileRoot}/videos` },
    { name: "Likes", href: `${profileRoot}/likes` },
    { name: "Feeds", href: `${profileRoot}/feeds` },

    { name: "Lists", href: `${profileRoot}/lists` },
  ];

  const isActiveTab = (href: string) => {
    if (href === profileRoot) {
      return pathname === profileRoot;
    }
    return pathname.startsWith(href);
  };

  if (isLoading) {
    return <ProfileHeaderSkeleton />;
  }

  if (
    pathname === `${profileRoot}/follows` ||
    pathname === `${profileRoot}/followers` ||
    pathname.startsWith(`${profileRoot}/post/`) ||
    pathname.startsWith(`${profileRoot}/lists/`)
  ) {
    return children;
  }

  return (
    <div className="flex min-h-[calc(100dvh-7rem)] w-full flex-col bg-white pb-20 lg:min-h-[calc(100dvh-3.5rem)]">
      {/* --- COVER & AVATAR --- */}
      <div className="relative h-32 bg-slate-100">
        <PhotoProvider>
          {profile?.coverUrl && (
            <PhotoView src={profile?.coverUrl}>
              <img
                src={profile?.coverUrl}
                alt="cover"
                className="h-full w-full object-cover cursor-pointer"
              />
            </PhotoView>
          )}
        </PhotoProvider>

        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="absolute left-4 top-4 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/20 text-white transition hover:bg-black/30"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="absolute -bottom-10 left-4 z-10 flex h-21 w-21 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#FF4F5A] text-[40px] font-bold text-white shadow-sm">
          <PhotoProvider>
            {profile?.avatarUrl ? (
              <PhotoView src={profile?.avatarUrl}>
                <img
                  src={profile.avatarUrl}
                  alt={profile.username}
                  className="h-full w-full object-cover cursor-pointer"
                />
              </PhotoView>
            ) : (
              profile?.username?.charAt(0).toUpperCase()
            )}
          </PhotoProvider>
        </div>
      </div>

      {/* --- ACTION BUTTONS --- */}
      <div className="flex justify-end gap-2 px-4 pt-3">
        {profile?.isOwner ? (
          <button
            type="button"
            onClick={() => setIsEditProfileModalOpen(true)}
            className="h-9 cursor-pointer rounded-full bg-gray-100 px-4 text-sm font-bold text-gray-900 transition hover:bg-gray-200"
          >
            Edit Profile
          </button>
        ) : profile?.id ? (
          <FollowButton targetUserId={profile.id} />
        ) : null}
        <button
          type="button"
          aria-label="More profile actions"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-900 transition hover:bg-gray-200"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* --- PROFILE INFO --- */}
      <div className="px-4 mt-2 mb-4">
        <div className="flex items-center gap-1">
          <h1 className="text-[22px] font-extrabold text-gray-900 leading-tight">
            {profile?.displayName}
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
      <div className="flex overflow-x-auto border-b border-gray-200 no-scrollbar sticky top-14 z-20 bg-white/95 backdrop-blur-sm lg:top-14">
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

      <EditProfileModal
        profile={profile}
        open={isEditProfileModalOpen}
        onOpenChange={setIsEditProfileModalOpen}
      />
    </div>
  );
}
