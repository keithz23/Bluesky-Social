import { Repeat2 } from "lucide-react";
import { useRepost } from "@/app/hooks/use-repost";
import { useRequireAuthAction } from "@/app/hooks/use-require-auth-action";

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
  const requireAuth = useRequireAuthAction();

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (!requireAuth()) return;
        toggleRepost();
      }}
      className={`group flex cursor-pointer items-center gap-0.5 sm:gap-1 ${
        isReposted ? "text-green-600" : "text-gray-500"
      }`}
    >
      <div className="rounded-full p-1.5 transition-colors group-hover:bg-green-50 sm:p-2">
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
