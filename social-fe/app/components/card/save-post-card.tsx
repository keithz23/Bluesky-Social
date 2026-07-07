"use client";

import {
  MessageSquare,
  Repeat2,
  Heart,
  Bookmark,
  Share,
} from "lucide-react";
import { useBookmark } from "@/app/hooks/use-bookmark";
import { useLike } from "@/app/hooks/use-like";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { PostMedia } from "../../interfaces/post.interface";
import { useMemo } from "react";
import { useRepost } from "@/app/hooks/use-repost";
import { useRouter } from "next/navigation";
import UserHoverCard from "./user-hover-card";
import AvatarHoverCard from "./avatar-hover-card";
import PostDropDown from "../dropdown/post-dropdown";
import {
  BookA,
  Clipboard,
  EyeOff,
  Funnel,
  TriangleAlert,
  UserX,
  VolumeOff,
} from "lucide-react";
import { DropdownItem } from "@/app/interfaces/dropdown/dropdown.interface";
import { PostContent } from "../post-content";
import { enUS } from "date-fns/locale";
import { formatDistanceToNow } from "date-fns";
import { useRequireAuthAction } from "@/app/hooks/use-require-auth-action";
// @ts-expect-error CSS side-effect import.
import 'react-photo-view/dist/react-photo-view.css';
import { PhotoProvider, PhotoView } from "react-photo-view";

const SavedPostCard = ({ bookmark }: { bookmark: any }) => {
  const router = useRouter();
  const post = bookmark.post;
  const { mutate: toggleLike } = useLike(post.id, post.isLiked);
  const { mutate: toggleBookmark } = useBookmark(post.id, true);
  const { mutate: toggleRepost } = useRepost(post.id, post.isReposted);
  const requireAuth = useRequireAuthAction();

  const handleProfileClick = () => {
    router.push(`/profile/${post.user.username}`);
  };

  const dropdownItems: DropdownItem[] = [
    { id: 1, title: "Translate", icon: <BookA size={18} /> },
    { id: 2, title: "Copy post text", icon: <Clipboard size={18} /> },
    { id: 3, title: "Mute thread", icon: <VolumeOff size={18} /> },
    { id: 4, title: "Mute words & tags", icon: <Funnel size={18} /> },
    { id: 5, title: "Hide post for me", icon: <EyeOff size={18} /> },
    { id: 6, title: "Mute account", icon: <VolumeOff size={18} /> },
    { id: 7, title: "Block account", icon: <UserX size={18} /> },
    { id: 8, title: "Report post", icon: <TriangleAlert size={18} /> },
  ];

  const formattedDate = useMemo(() => {
    const distance = formatDistanceToNow(
      new Date(post.createdAt || new Date()),
      {
        addSuffix: false,
        locale: enUS,
      },
    );

    return distance
      .replace(/^about\s/, "")
      .replace(/^almost\s/, "")
      .replace(/^over\s/, "")
      .replace("less than a minute", "now")
      .replace(/\s?minutes?/, "m")
      .replace(/\s?hours?/, "h")
      .replace(/\s?days?/, "d")
      .replace(/\s?months?/, "mo")
      .replace(/\s?years?/, "y");
  }, [post.createdAt]);

  const fullDate = useMemo(
    () =>
      new Date(post.createdAt || new Date()).toLocaleString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [post.createdAt],
  );

  return (
    <>
      <div
        className="flex gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer"
        onClick={handleProfileClick}
      >
        {/* Avatar */}
        <AvatarHoverCard data={bookmark} />

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-x-1">
            <div className="font-bold text-[15px]">
              <UserHoverCard
                data={post}
                handleProfileClick={handleProfileClick}
              />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="text-gray-500 text-sm cursor-pointer"
                  suppressHydrationWarning
                >
                  {formattedDate}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p suppressHydrationWarning>{fullDate}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <PostContent content={post.content} />

          {post.media?.length > 0 && (
            <Carousel opts={{ align: "start" }} className="mb-2 w-full sm:mb-3">
              <CarouselContent onClick={(e) => e.stopPropagation()}>
                <PhotoProvider>
                  {post.media.map((m: PostMedia) => (
                    <PhotoView src={m.mediaUrl} key={m.id}>
                      <CarouselItem
                        className={
                          post.media.length === 1
                            ? "basis-full"
                            : "basis-[88%] sm:basis-[85%]"
                        }
                      >
                        <div
                          className={`w-full overflow-hidden rounded-xl border border-gray-100 bg-gray-100 ${post.media.length === 1
                            ? "aspect-video"
                            : "h-56 sm:h-64"
                            }`}
                        >
                          <img
                            src={m.mediaUrl}
                            alt={m.altText ?? ""}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </CarouselItem>
                    </PhotoView>
                  ))}
                </PhotoProvider>
              </CarouselContent>
            </Carousel>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-3 text-gray-500 max-w-md">
            <button className="flex items-center gap-1.5 hover:text-blue-500 transition group cursor-pointer">
              <div className="p-1.5 rounded-full group-hover:bg-blue-50 transition -ml-1.5">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-[13px]">{post.replyCount}</span>
            </button>

            <button
              className="flex items-center gap-1.5 hover:text-green-500 transition group cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (!requireAuth()) return;
                toggleRepost();
              }}
            >
              <div className="p-1.5 rounded-full group-hover:bg-green-50 transition -ml-1.5">
                <Repeat2
                  className={`w-4 h-4 transition-colors ${post.isReposted ? "text-green-600" : "group-hover:text-green-600"}`}
                />
              </div>
              <span
                className={`text-[13px] ${post.isReposted ? "text-green-600" : ""}`}
              >
                {post.repostCount}
              </span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!requireAuth()) return;
                toggleLike();
              }}
              className="flex items-center gap-1.5 hover:text-pink-500 transition group cursor-pointer"
            >
              <div className="p-1.5 rounded-full group-hover:bg-pink-50 transition -ml-1.5">
                <Heart
                  className={`w-4 h-4 transition-colors ${post.isLiked ? "fill-pink-500 text-pink-500" : ""}`}
                />
              </div>
              <span
                className={`text-[13px] ${post.isLiked ? "text-pink-500" : ""}`}
              >
                {post.likeCount}
              </span>
            </button>

            {/* Bookmark — click for unbookmark */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!requireAuth()) return;
                toggleBookmark();
              }}
              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition group cursor-pointer"
            >
              <div className="p-1.5 rounded-full group-hover:bDg-blue-50 transition -ml-1.5">
                <Bookmark className="w-4 h-4" fill="currentColor" />
              </div>
            </button>

            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-full hover:bg-blue-50 hover:text-blue-500 transition cursor-pointer">
                <Share className="w-4 h-4" />
              </button>
              <PostDropDown post={post} items={dropdownItems} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SavedPostCard;
