import { Bookmark } from "lucide-react";
import { useBookmark } from "../../hooks/use-bookmark";
import { useRequireAuthAction } from "@/app/hooks/use-require-auth-action";

const BookMarkButton = ({
  postId,
  isBookmarked,
  bookmarkCount,
}: {
  postId: string;
  isBookmarked: boolean;
  bookmarkCount: number;
}) => {
  const { mutate: toggleBookmark } = useBookmark(postId, isBookmarked);
  const requireAuth = useRequireAuthAction();

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (!requireAuth()) return;
        toggleBookmark();
      }}
      className="group flex cursor-pointer items-center gap-0.5 sm:gap-1"
    >
      <div className="rounded-full p-1.5 transition-colors group-hover:bg-blue-50 sm:p-2">
        <Bookmark
          size={18}
          strokeWidth={2.2}
          className={`transition-colors ${
            isBookmarked
              ? "fill-blue-500 text-blue-500"
              : "group-hover:text-blue-500"
          }`}
        />
      </div>
      <span
        className={`transition-colors text-sm ${
          isBookmarked ? "text-blue-500" : "group-hover:text-blue-500"
        }`}
      >
        {bookmarkCount}
      </span>
    </div>
  );
};

export default BookMarkButton;
