import {
  MessageCircle,
  Repeat,
  Heart,
  Bookmark,
  Share,
  MoreHorizontal,
} from "lucide-react";
import BackToTop from "../components/back-to-top";

export default function HomePage() {
  return (
    <>
      {/* Header Tabs */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="flex text-md font-bold h-13 items-center">
          <div className="flex-1 text-center border-b-2 border-blue-500 h-full flex items-center justify-center cursor-pointer hover:bg-gray-50 transition">
            Discover
          </div>
          <div className="flex-1 text-center h-full flex items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-50 transition">
            Feeds ✨
          </div>
        </div>
      </div>

      {/* Feed List */}
      <div className="flex flex-col">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="p-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer"
          >
            <div className="flex gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-gray-200 to-gray-300 shrink-0"></div>

              {/* Post Content */}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div className="font-bold text-[15px] hover:underline cursor-pointer">
                    User {i + 1}{" "}
                    <span className="text-gray-500 font-normal ml-1">
                      @user{i + 1}.bsky.social · {i + 1}h
                    </span>
                  </div>
                </div>

                <p className="mt-1 text-[15px] leading-normal text-gray-900">
                  lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                  lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                  lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                  lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                  lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                </p>

                {/* --- REACTION BAR --- */}
                <div className="flex items-center justify-between mt-3 text-gray-500 text-sm">
                  {/* LEFT SIDE: reply, repost, like */}
                  <div className="flex items-center gap-8">
                    {/* Reply */}
                    <div className="flex items-center gap-1 group cursor-pointer">
                      <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                        <MessageCircle
                          size={18}
                          strokeWidth={2.2}
                          className="group-hover:text-blue-500 transition-colors"
                        />
                      </div>
                      <span className="group-hover:text-blue-500 transition-colors">
                        127
                      </span>
                    </div>

                    {/* Repost */}
                    <div className="flex items-center gap-1 group cursor-pointer">
                      <div className="p-2 rounded-full group-hover:bg-green-50 transition-colors">
                        <Repeat
                          size={18}
                          strokeWidth={2.2}
                          className="group-hover:text-green-600 transition-colors"
                        />
                      </div>
                      <span className="group-hover:text-green-600 transition-colors">
                        61
                      </span>
                    </div>

                    {/* Like */}
                    <div className="flex items-center gap-1 group cursor-pointer">
                      <div className="p-2 rounded-full group-hover:bg-pink-50 transition-colors">
                        <Heart
                          size={18}
                          strokeWidth={2.2}
                          className="group-hover:text-pink-500 transition-colors"
                        />
                      </div>
                      <span className="group-hover:text-pink-500 transition-colors">
                        1.8K
                      </span>
                    </div>
                  </div>

                  {/* RIGHT SIDE: bookmark, share, more */}
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full hover:bg-gray-100 cursor-pointer transition-colors">
                      <Bookmark size={18} strokeWidth={2.2} />
                    </div>

                    <div className="p-2 rounded-full hover:bg-gray-100 cursor-pointer transition-colors">
                      <Share size={18} strokeWidth={2.2} />
                    </div>

                    <div className="p-2 rounded-full hover:bg-gray-100 cursor-pointer transition-colors">
                      <MoreHorizontal size={18} strokeWidth={2.2} />
                    </div>
                  </div>
                </div>
                {/* --- END REACTION BAR --- */}
              </div>
            </div>
          </div>
        ))}
        <BackToTop />
      </div>
    </>
  );
}
