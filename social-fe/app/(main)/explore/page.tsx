"use client";

import { FollowButton } from "@/app/components/button/follow-button";
import { useSuggestedUsers } from "@/app/hooks/use-suggestions";
import { SuggestionsUser } from "@/app/interfaces/suggestion.interface";
import {
  Search,
  Flame,
  TrendingUp,
  SlidersHorizontal,
  Pin,
  ChevronDown,
  UserCircle2,
  ChevronRight,
  Layers,
  BadgeCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ExplorePage() {
  const router = useRouter();
  const { data: users = [], isLoading } = useSuggestedUsers(20);
  // --- MOCK DATA ---
  const trendingTopics = [
    {
      id: 1,
      title: "Tricia McLaughlin",
      posts: "315",
      category: "Politics",
      badge: "hot",
    },
    {
      id: 2,
      title: "Democratic Politics",
      posts: "614",
      category: "Politics",
      badge: "new",
    },
    {
      id: 3,
      title: "Ukraine Conflict",
      posts: "631",
      category: "Politics",
      badge: "new",
    },
    {
      id: 4,
      title: "Canada Sports",
      posts: "772",
      category: "Sports",
      badge: "new",
    },
    {
      id: 5,
      title: "Stephen Colbert",
      posts: "2.3K",
      category: "Politics",
      badge: "time",
      time: "3h ago",
    },
  ];

  const feeds = [
    {
      id: 1,
      title: "Art: What's Hot",
      author: "@wanderingworld.bsky.social",
      likes: "11,396",
      avatar: "🎨",
      bgColor: "bg-red-400",
      description:
        "See what's hot in art by human artists! Filters out AI/NFTs. Use #art to post. Pulls from a growing list of popular art related hashtags. Please Pin, Like and Share to help the feed get discovered!",
    },
    {
      id: 2,
      title: "Immigration Rights Wa...",
      author: "@flipboard.com",
      likes: "9",
      avatar: "🌉",
      bgColor: "bg-blue-400",
      description:
        "News on the action of the federal government against immigrants in Trump's America.\n\nCreated with surf.social",
    },
    {
      id: 3,
      title: "📰 News",
      author: "@aendra.com",
      likes: "",
      avatar: "📰",
      bgColor: "bg-gray-300",
      description:
        "Headlines from verified news organisations in reverse-chronological order. Maintained by",
    },
  ];

  const filterTabs = [
    "For You",
    "Books",
    "Art",
    "Animals",
    "Comics",
    "Culture",
    "Comedy",
  ];

  return (
    <div className="flex flex-col w-full bg-white pb-20">
      {/* --- STICKY HEADER --- */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 pt-3 pb-3 px-4">
        <div className="relative group mb-3">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500" />
          </div>
          <input
            type="text"
            placeholder="Search for posts, users, or feeds"
            className="w-full bg-gray-100 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition outline-none"
          />
        </div>
        <button className="w-full bg-blue-600 text-white font-bold text-sm py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer">
          Edit Interests
        </button>
      </div>

      {/* --- TRENDING TOPICS --- */}
      <div className="flex flex-col border-b border-gray-100">
        {trendingTopics.map((topic, index) => (
          <div
            key={topic.id}
            className="flex items-center justify-between p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition"
          >
            <div className="flex flex-col gap-1">
              <span className="font-bold text-base text-gray-900">
                {index + 1}. {topic.title}
              </span>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="flex items-center -space-x-1.5">
                  <div className="w-5 h-5 rounded-full bg-gray-300 border-2 border-white"></div>
                  <div className="w-5 h-5 rounded-full bg-gray-400 border-2 border-white"></div>
                  <div className="w-5 h-5 rounded-full bg-gray-500 border-2 border-white"></div>
                </div>
                <span>
                  {topic.posts} posts · {topic.category}
                </span>
              </div>
            </div>

            {topic.badge === "hot" && (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-500 rounded-md text-xs font-bold">
                <Flame className="w-3 h-3" /> Hot
              </div>
            )}
            {topic.badge === "new" && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-emerald-600 rounded-md text-xs font-bold">
                <TrendingUp className="w-3 h-3" /> New
              </div>
            )}
            {topic.badge === "time" && (
              <div className="text-sm text-gray-500">{topic.time}</div>
            )}
          </div>
        ))}
      </div>

      {/* --- DISCOVER NEW FEEDS --- */}
      <div className="flex items-center justify-between p-4 mt-2">
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-bold text-gray-900">
            Discover New Feeds
          </h2>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-full transition cursor-pointer">
          <Search className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex flex-col">
        {feeds.map((feed) => (
          <div
            key={feed.id}
            className="p-4 border-b border-gray-100 hover:bg-gray-50 transition flex gap-3"
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl ${feed.bgColor}`}
            >
              {feed.avatar}
            </div>
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

      <button className="w-full py-4 flex items-center justify-center gap-2 text-sm text-gray-700 font-medium hover:bg-gray-50 transition border-b border-gray-100 cursor-pointer">
        Load more suggested feeds
        <ChevronDown className="w-4 h-4" />
      </button>

      {/* --- SUGGESTED ACCOUNTS --- */}
      <div className="pt-4">
        <div className="flex items-center justify-between px-4 mb-3">
          <div className="flex items-center gap-2">
            <UserCircle2 className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-900">
              Suggested Accounts
            </h2>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full transition cursor-pointer">
            <Search className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto px-4 pb-2 hide-scrollbar">
          {filterTabs.map((tab, idx) => (
            <button
              key={tab}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium border transition cursor-pointer ${
                idx === 0
                  ? "bg-gray-100 text-gray-900 border-gray-100"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab}
            </button>
          ))}
          <button className="p-1.5 rounded-full border border-gray-200 hover:bg-gray-50 shrink-0 cursor-pointer">
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-col mt-2 border-t border-gray-100">
          {users.map((user: SuggestionsUser) => (
            <div
              key={user.id}
              className="p-4 border-b border-gray-100 hover:bg-gray-50 transition flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold shrink-0">
                {user.username.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col truncate pr-4">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-gray-900 truncate hover:underline cursor-pointer">
                        {user.username}
                      </span>
                      {user.verified && (
                        <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
                      )}
                    </div>
                    <span className="text-sm text-gray-500 truncate">
                      {user.username}
                    </span>
                  </div>
                  <FollowButton targetUserId={user.id} />
                </div>
                <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                  {user.bio}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- STARTER PACKS --- */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-gray-900">Starter Packs</h2>
        </div>

        {/* Card Starter Pack */}
        <div className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition cursor-pointer">
          <div className="flex items-center mb-3">
            <div className="flex -space-x-2">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`w-10 h-10 rounded-full border-2 border-white bg-gray-${((i % 5) + 3) * 100}`}
                ></div>
              ))}
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-500 text-white text-xs font-bold flex items-center justify-center -ml-2 z-10">
              +53
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex flex-col">
              <h3 className="font-bold text-gray-900">BlueSky Celebrities</h3>
              <span className="text-sm text-gray-500 hover:underline">
                By @ilahey.com
              </span>
            </div>
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-sm px-4 py-2 rounded-full transition">
              Open pack
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
