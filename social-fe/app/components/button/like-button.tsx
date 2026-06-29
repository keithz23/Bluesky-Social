import { Heart } from "lucide-react";
import { useLike } from "../../hooks/use-like";
import { useRequireAuthAction } from "@/app/hooks/use-require-auth-action";

const LikeButton = ({
  postId,
  isLiked,
  likeCount,
}: {
  postId: string;
  isLiked: boolean;
  likeCount: number;
}) => {
  const { mutate: toggleLike } = useLike(postId, isLiked);
  const requireAuth = useRequireAuthAction();

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (!requireAuth()) return;
        toggleLike();
      }}
      className="group flex cursor-pointer items-center gap-0.5 sm:gap-1"
    >
      <div className="rounded-full p-1.5 transition-colors group-hover:bg-pink-50 sm:p-2">
        <Heart
          size={18}
          strokeWidth={2.2}
          className={`transition-colors ${isLiked ? "fill-pink-500 text-pink-500" : "group-hover:text-pink-500"}`}
        />
      </div>
      <span
        className={`transition-colors ${isLiked ? "text-pink-500" : "group-hover:text-pink-500"}`}
      >
        {likeCount}
      </span>
    </div>
  );
};

export default LikeButton;
