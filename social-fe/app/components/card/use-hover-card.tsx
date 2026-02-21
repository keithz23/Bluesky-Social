import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { BadgeCheck } from "lucide-react";
import { Feed } from "../../interfaces/feed.interface";
import { useFollow } from "../../hooks/use-follow";

interface UserHoverCardProps {
  post: Feed;
}

export default function UserHoverCard({ post }: UserHoverCardProps) {
  console.log(post);
  const { follow } = useFollow(post.user.id);
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <span>
          {post.user.username}{" "}
          <span className="text-gray-500 font-normal ml-1">
            ·{" "}
            {post.createdAt
              ? new Date(post.createdAt).toLocaleDateString()
              : new Date(post.post.createdAt).toLocaleDateString()}
          </span>
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-72 p-4 rounded-2xl shadow-xl border border-gray-100">
        <div className="flex justify-between items-start mb-3">
          {/* Avatar */}
          <Avatar className="w-14 h-14">
            <AvatarImage
              src={post.user.avatarUrl}
              alt={post.user.username}
              className="object-cover"
            />
            <AvatarFallback className="bg-gray-300 text-gray-600 text-xl">
              {post.user.username?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          {/* Follow button */}
          {post.user.followStatus !== null &&
            (post.user.followStatus === "following" ? (
              <button className="border border-gray-300 hover:bg-gray-100 text-gray-900 text-sm font-bold px-4 py-1.5 rounded-full transition cursor-pointer">
                Following
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  follow.mutate();
                }}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-1.5 rounded-full transition cursor-pointer"
              >
                + Follow
              </button>
            ))}
        </div>

        {/* Name + handle */}
        <div className="mb-2">
          <div className="flex items-center gap-1">
            <p className="font-extrabold text-[16px] text-gray-900">
              {post.user.username}
            </p>
            {post.user.verified && (
              <BadgeCheck className="w-4 h-4 text-blue-500" />
            )}
          </div>
          <p className="text-gray-500 text-sm">@{post.user.username}</p>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-3 text-sm">
          <div>
            <span className="font-bold text-gray-900">
              {post.user.followersCount?.toLocaleString() ?? 0}
            </span>{" "}
            <span className="text-gray-500">followers</span>
          </div>
          <div>
            <span className="font-bold text-gray-900">
              {post.user.followingCount?.toLocaleString() ?? 0}
            </span>{" "}
            <span className="text-gray-500">following</span>
          </div>
        </div>

        {/* Bio */}
        {post.user.bio && (
          <p className="text-sm text-gray-700 leading-snug line-clamp-3">
            {post.user.bio}
          </p>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
