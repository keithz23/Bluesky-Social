import { Repeat2 } from "lucide-react";
import { useRepost } from "@/app/hooks/use-repost";

const RepostButton = ({
  postId,
  isReposted,
  repostCount,
}: {
  postId: string;
  isReposted: boolean;
  repostCount: number;
}) => {
  const { mutate: toggleRepost } = useRepost(postId, isReposted);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        toggleRepost();
      }}
      className={`flex items-center gap-1 group cursor-pointer ${
        isReposted ? "text-green-600" : "text-gray-500"
      }`}
    >
      <div className="p-2 rounded-full group-hover:bg-green-50 transition-colors">
        <Repeat2
          size={18}
          strokeWidth={2.2}
          className={`transition-colors ${
            isReposted ? "text-green-600" : "group-hover:text-green-600"
          }`}
        />
      </div>
      <span
        className={`transition-colors text-sm ${
          isReposted ? "text-green-600" : "group-hover:text-green-600"
        }`}
      >
        {repostCount}
      </span>
    </div>
  );
};

export default RepostButton;
