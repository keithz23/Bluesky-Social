import { Bookmark } from "lucide-react";
import { useBookmark } from "../../hooks/use-bookmark";

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

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        toggleBookmark();
      }}
      className="flex items-center gap-1 group cursor-pointer"
    >
      <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
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
