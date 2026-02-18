"use client"
import {
  ArrowLeft,
  MessageSquare,
  Repeat2,
  Heart,
  Bookmark,
  Share,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";

export default function SavedPostsPage() {
  const templates = [
    {
      authorName: "Richard Kadrey",
      authorHandle: "@richardkadrey.bsky.social",
      avatar: "https://i.pravatar.cc/150?img=11",
      time: "54m",
      text: "2026 basically",
      image: "https://picsum.photos/seed/icecream/600/600",
      replies: "36",
      reposts: "1.4K",
      likes: "4.5K",
    },
    {
      authorName: "Frontend Daily",
      authorHandle: "@frontend.daily",
      avatar: "https://i.pravatar.cc/150?img=32",
      time: "2h",
      text: "A clean and scalable React architecture is key to maintaining large applications. Don't forget to decouple your UI from your business logic! ⚛️🚀",
      image: null,
      replies: "124",
      reposts: "56",
      likes: "892",
    },
    {
      authorName: "Nature Photography",
      authorHandle: "@nature.pics",
      avatar: "https://i.pravatar.cc/150?img=43",
      time: "4h",
      text: "Morning vibes in the mountains.",
      image: "https://picsum.photos/seed/mountain/600/400",
      replies: "12",
      reposts: "40",
      likes: "3.2K",
    },
    {
      authorName: "Tech Insider",
      authorHandle: "@techinsider.news",
      avatar: "https://i.pravatar.cc/150?img=15",
      time: "6h",
      text: "Breaking: The new framework just dropped and it claims to be 10x faster than current solutions. What are your thoughts?",
      image: null,
      replies: "450",
      reposts: "230",
      likes: "1.1K",
    },
    {
      authorName: "Design Inspiration",
      authorHandle: "@uiux.design",
      avatar: "https://i.pravatar.cc/150?img=20",
      time: "10h",
      text: "Dark mode isn't just a trend, it's an accessibility feature. Here are 5 tips for designing perfect dark themes. 🎨✨",
      image: "https://picsum.photos/seed/design/600/500",
      replies: "89",
      reposts: "312",
      likes: "5.6K",
    },
  ];

  const savedPosts = Array.from({ length: 15 }).map((_, index) => ({
    id: `post-${index}`,
    ...templates[index % 5],
  }));

  return (
    <div className="flex flex-col w-full bg-white min-h-screen pb-20">
      {/* --- HEADER --- */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 flex items-center p-4">
        <Link
          href="/"
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 ml-4">Saved Posts</h1>
      </div>

      {/* --- POSTS LIST --- */}
      <div className="flex flex-col">
        {savedPosts.map((post) => (
          <div
            key={post.id}
            className="flex gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer"
          >
            {/* Avatar */}
            <div className="shrink-0">
              <img
                src={post.avatar}
                alt={post.authorName}
                className="w-12 h-12 rounded-full object-cover bg-gray-200"
              />
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 min-w-0">
              {/* Author info */}
              <div className="flex items-center gap-1 text-[15px] truncate">
                <span className="font-bold text-gray-900 hover:underline truncate">
                  {post.authorName}
                </span>
                <span className="text-gray-500 truncate">
                  {post.authorHandle} · {post.time}
                </span>
              </div>

              {/* Text */}
              <p className="text-[15px] text-gray-900 mt-0.5 whitespace-pre-wrap leading-snug">
                {post.text}
              </p>

              {/* Image */}
              {post.image && (
                <div className="mt-3 relative rounded-xl overflow-hidden border border-gray-100 max-h-125">
                  <img
                    src={post.image}
                    alt="Post media"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                    Alt
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-3 text-gray-500 max-w-md">
                <button className="flex items-center gap-1.5 hover:text-blue-500 transition group">
                  <div className="p-1.5 rounded-full group-hover:bg-blue-50 transition -ml-1.5">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <span className="text-[13px]">{post.replies}</span>
                </button>

                <button className="flex items-center gap-1.5 hover:text-green-500 transition group">
                  <div className="p-1.5 rounded-full group-hover:bg-green-50 transition -ml-1.5">
                    <Repeat2 className="w-4 h-4" />
                  </div>
                  <span className="text-[13px]">{post.reposts}</span>
                </button>

                <button className="flex items-center gap-1.5 hover:text-pink-500 transition group">
                  <div className="p-1.5 rounded-full group-hover:bg-pink-50 transition -ml-1.5">
                    <Heart className="w-4 h-4" />
                  </div>
                  <span className="text-[13px]">{post.likes}</span>
                </button>

                <button className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition group">
                  <div className="p-1.5 rounded-full group-hover:bg-blue-50 transition -ml-1.5">
                    <Bookmark className="w-4.5" fill="currentColor" />
                  </div>
                </button>

                {/* Share & More */}
                <div className="flex items-center gap-1">
                  <button className="p-1.5 rounded-full hover:bg-blue-50 hover:text-blue-500 transition">
                    <Share className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 rounded-full hover:bg-blue-50 hover:text-blue-500 transition">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
