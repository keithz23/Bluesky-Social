import { useFollow, useFollowStatus } from "../../hooks/use-follow";

export const FollowButton = ({ targetUserId }: { targetUserId: string }) => {
  const { data } = useFollowStatus(targetUserId);
  const { follow, unfollow } = useFollow(targetUserId);

  const status = data?.status ?? "none";

  if (status === "following") {
    return (
      <button
        onClick={() => unfollow.mutate()}
        className="bg-gray-200 hover:bg-red-100 hover:text-red-600 text-gray-800 font-bold text-sm px-4 py-1.5 rounded-full shrink-0 cursor-pointer transition-colors group"
      >
        <span className="group-hover:hidden">Following</span>
        <span className="hidden group-hover:inline">Unfollow</span>
      </button>
    );
  }

  if (status === "requested") {
    return (
      <button
        disabled
        className="bg-gray-100 text-gray-400 font-bold text-sm px-4 py-1.5 rounded-full shrink-0 cursor-not-allowed border border-gray-200"
      >
        Requested
      </button>
    );
  }

  return (
    <button
      onClick={() => follow.mutate()}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-1.5 rounded-full shrink-0 cursor-pointer transition-colors"
    >
      Follow
    </button>
  );
};
