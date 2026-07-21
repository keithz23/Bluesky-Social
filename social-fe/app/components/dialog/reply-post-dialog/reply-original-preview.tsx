import { Feed } from "@/app/interfaces/feed.interface";
import AvatarHoverCard from "../../card/avatar-hover-card";

type ReplyOriginalPreviewProps = {
  post: Feed;
};

export function ReplyOriginalPreview({ post }: ReplyOriginalPreviewProps) {
  return (
    <>
      <div className="px-4 flex justify-between items-start mt-2">
        <div className="flex gap-3">
          <AvatarHoverCard data={post} />
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-bold text-[15px] text-gray-900">
                {post.user.username}
              </span>
              {post.user.verified && (
                <svg
                  viewBox="0 0 24 24"
                  aria-label="Verified account"
                  className="w-4.5 h-4.5 text-[#0066FF]"
                  fill="currentColor"
                >
                  <g>
                    <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.792-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.827 2.74 2.043 3.39-.11.457-.167.936-.167 1.41 0 2.21 1.71 4 3.918 4 .537 0 1.058-.11 1.536-.31.587 1.25 1.854 2.11 3.337 2.11 1.48 0 2.75-.86 3.336-2.11.478.2.998.31 1.536.31 2.21 0 3.918-1.79 3.918-4 0-.474-.057-.953-.167-1.41 1.216-.65 2.043-1.93 2.043-3.39zM10.25 16.5l-3.5-3.5 1.41-1.41L10.25 13.67l7.09-7.09 1.41 1.41L10.25 16.5z" />
                  </g>
                </svg>
              )}
            </div>
            <span className="text-[15px] mt-0.5">{post.content}</span>
          </div>
        </div>

        {post.media.length > 0 && (
          <div className="w-15 h-15 border border-gray-100 overflow-hidden shrink-0 bg-white flex flex-col justify-center">
            <div
              className={`w-full h-full grid gap-px ${
                post.media.length === 1 ? "grid-cols-1" : "grid-cols-2"
              } ${post.media.length > 2 ? "grid-rows-2" : "grid-rows-1"}`}
            >
              {post.media.slice(0, 4).map((media, index) => (
                <div
                  key={media.id || index}
                  className={`w-full h-full overflow-hidden ${
                    post.media.length === 3 && index === 0 ? "row-span-2" : ""
                  }`}
                >
                  <img
                    src={media.mediaUrl}
                    alt={media.altText ?? "Reply post image"}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mx-4 my-3 border-b border-gray-200"></div>
    </>
  );
}
