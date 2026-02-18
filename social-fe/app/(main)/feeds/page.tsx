"use client";
import {
  ArrowLeft,
  Settings,
  SlidersHorizontal,
  Flame,
  ArrowDownUp,
  Film,
  Search,
  Pin,
  Heart,
  Users,
  FlaskConical,
  Palette,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export default function FeedsPage() {
  const myFeedsLinks = [
    {
      id: "discover",
      title: "Discover",
      icon: <Flame className="w-5 h-5 text-white" />,
      bgColor: "bg-blue-500",
    },
    {
      id: "following",
      title: "Following",
      icon: <ArrowDownUp className="w-5 h-5 text-white" />,
      bgColor: "bg-blue-600",
    },
    {
      id: "video",
      title: "Video",
      icon: <Film className="w-5 h-5 text-white" />,
      bgColor: "bg-blue-500",
    },
  ];

  const suggestedFeeds = [
    {
      id: 1,
      title: "Popular With Friends",
      author: "@bsky.app",
      description:
        "A mix of popular content from accounts you follow and content that your follows like.",
      likes: "40,850",
      icon: <Heart className="w-6 h-6 text-white" fill="currentColor" />,
      bgColor: "bg-blue-500",
    },
    {
      id: 2,
      title: "Mutuals",
      author: "@skyfeed.xyz",
      description: "Posts from users who are following you back",
      likes: "28,481",
      icon: <Users className="w-6 h-6 text-white" fill="currentColor" />,
      bgColor: "bg-slate-800",
    },
    {
      id: 3,
      title: "Science",
      author: "@bossett.social",
      description:
        "The Science Feed. A curated feed from Bluesky professional scientists, science communicators, and science/nature photographer/artists. See l.bossett.io/vkeNf for more information! 🧪",
      likes: "29,155",
      icon: <FlaskConical className="w-6 h-6 text-white" />,
      bgColor: "bg-blue-600",
    },
    {
      id: 4,
      title: "Artists: Trending",
      author: "@bsky.art",
      description:
        "General art feed — image posts from artists across Bluesky, sorted by trending. For information on how to post and affiliated accounts, visit: www.bsky.art",
      likes: "",
      icon: <Palette className="w-6 h-6 text-white" />,
      bgColor: "bg-black",
    },
  ];

  return (
    <div className="flex flex-col w-full bg-white pb-20 min-h-screen">
      {/* --- HEADER --- */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 flex items-center justify-between p-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Feeds</h1>
        </div>
        <button className="p-2 -mr-2 hover:bg-gray-100 rounded-full transition cursor-pointer">
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* --- MY FEEDS SECTION --- */}
      <div className="flex flex-col">
        {/* Title My Feeds */}
        <div className="flex items-start gap-4 p-4 hover:bg-gray-50 transition cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-6 h-6 text-blue-500" />
          </div>
          <div className="flex flex-col pt-1">
            <h2 className="text-xl font-bold text-gray-900">My Feeds</h2>
            <p className="text-sm text-gray-600 mt-1">
              All the feeds you've saved, right in one place.
            </p>
          </div>
        </div>

        {/* Lists My Feeds */}
        <div className="flex flex-col">
          {myFeedsLinks.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 border-t border-gray-100 hover:bg-gray-50 transition cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${item.bgColor}`}
                >
                  {item.icon}
                </div>
                <span className="font-bold text-gray-900">{item.title}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          ))}
        </div>
      </div>

      <div className="h-0.5 bg-gray-100 w-full"></div>

      {/* --- DISCOVER NEW FEEDS SECTION --- */}
      <div className="flex flex-col">
        {/* Title Discover */}
        <div className="flex items-start gap-4 p-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-6 h-6 text-blue-500" />
          </div>
          <div className="flex flex-col pt-1">
            <h2 className="text-xl font-bold text-gray-900">
              Discover New Feeds
            </h2>
            <p className="text-sm text-gray-600 mt-1 leading-snug">
              Choose your own timeline! Feeds built by the community help you
              find content you love.
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-4 border-b border-gray-100">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500" />
            </div>
            <input
              type="text"
              placeholder="Search feeds"
              className="w-full bg-gray-100 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition outline-none"
            />
          </div>
        </div>

        {/* Lists Feed gợi ý */}
        <div className="flex flex-col">
          {suggestedFeeds.map((feed) => (
            <div
              key={feed.id}
              className="p-4 border-b border-gray-100 hover:bg-gray-50 transition flex gap-3"
            >
              {/* Icon Feed */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${feed.bgColor}`}
              >
                {feed.icon}
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex flex-col">
                    <h3 className="font-bold text-base text-gray-900 leading-tight">
                      {feed.title}
                    </h3>
                    <span className="text-sm text-gray-500">
                      Feed by {feed.author}
                    </span>
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-1.5 px-3 rounded-full flex items-center gap-1.5 transition shrink-0 ml-2 cursor-pointer">
                    <Pin className="w-4 h-4" /> Pin Feed
                  </button>
                </div>

                <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap leading-snug">
                  {feed.description}
                </p>

                {feed.likes && (
                  <p className="text-sm text-gray-500 font-medium mt-2">
                    Liked by {feed.likes} users
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
