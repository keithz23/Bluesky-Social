import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { BadgeCheck } from "lucide-react";
import { useFollow } from "../../hooks/use-follow";
import Avatar from "../avatar";

interface UserHoverCardProps {
  data: any;
}

export default function UserHoverCard({ data }: UserHoverCardProps) {
  const { follow } = useFollow(data.user.id);
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <span>{data.user.username} </span>
      </HoverCardTrigger>

      <HoverCardContent className="w-72 p-4 rounded-2xl shadow-xl border border-gray-100">
        <div className="flex justify-between items-start mb-3">
          {/* Avatar */}
          <Avatar data={data.user} />

          {/* Follow button */}
          {data.user.followStatus !== null &&
            (data.user.followStatus === "following" ? (
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
              {data.user.username}
            </p>
            {data.user.verified && (
              <BadgeCheck className="w-4 h-4 text-blue-500" />
            )}
          </div>
          <p className="text-gray-500 text-sm">@{data.user.username}</p>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-3 text-sm">
          <div>
            <span className="font-bold text-gray-900">
              {data.user.followersCount?.toLocaleString() ?? 0}
            </span>{" "}
            <span className="text-gray-500">followers</span>
          </div>
          <div>
            <span className="font-bold text-gray-900">
              {data.user.followingCount?.toLocaleString() ?? 0}
            </span>{" "}
            <span className="text-gray-500">following</span>
          </div>
        </div>

        {/* Bio */}
        {data.user.bio && (
          <p className="text-sm text-gray-700 leading-snug line-clamp-3">
            {data.user.bio}
          </p>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
