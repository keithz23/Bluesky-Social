import { Heart } from "lucide-react";
import { useLike } from "../../hooks/use-like";

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

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        toggleLike();
      }}
      className="flex items-center gap-1 group cursor-pointer"
    >
      <div className="p-2 rounded-full group-hover:bg-pink-50 transition-colors">
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
