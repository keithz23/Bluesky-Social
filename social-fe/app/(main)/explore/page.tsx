"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Flame, Hash, Search, SlidersHorizontal, Users } from "lucide-react";
import { useExplore } from "@/app/hooks/use-explore";
import { FollowButton } from "@/app/components/button/follow-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExplorePage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => setQuery(input.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [input]);

  const { data, isLoading, isError, refetch } = useExplore(query);
  const hasResults = Boolean(data?.topics.length || data?.accounts.length || data?.feeds.length);

  return (
    <div className="flex w-full flex-col bg-white pb-20">
      <header className="sticky top-14 z-20 border-b bg-white/90 p-4 backdrop-blur-md">
        <h1 className="text-xl font-bold">Explore</h1>
        <form
          className="relative mt-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (input.trim()) router.push(`/search?q=${encodeURIComponent(input.trim())}`);
          }}
        >
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <Input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Search topics, people, feeds or posts" className="pl-9" />
        </form>
        {input.trim() && <p className="mt-2 text-xs text-gray-500">Press Enter to search all posts and people.</p>}
      </header>

      {isLoading && <div className="space-y-3 p-4">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-20 w-full" />)}</div>}
      {isError && <div className="p-8 text-center"><p className="text-gray-600">Explore is unavailable right now.</p><Button className="mt-3" onClick={() => refetch()}>Try again</Button></div>}

      {!isLoading && !isError && !hasResults && (
        <div className="p-10 text-center"><Search className="mx-auto size-8 text-gray-400" /><p className="mt-3 font-medium">No discovery results for “{query}”.</p></div>
      )}

      {!isLoading && !isError && data && (
        <>
          {data.topics.length > 0 && (
            <section className="border-b-4 border-gray-100">
              <div className="flex items-center gap-2 p-4"><Flame className="size-5 text-orange-500" /><h2 className="text-lg font-bold">{query ? "Topics" : "Trending this week"}</h2></div>
              {data.topics.map((topic, index) => (
                <Link key={topic.id} href={`/search?q=${encodeURIComponent(`#${topic.name}`)}&tab=posts`} className="flex items-center justify-between border-t p-4 hover:bg-gray-50">
                  <div><p className="font-bold"><span className="mr-2 text-gray-400">{index + 1}</span>#{topic.name}</p><p className="mt-1 text-sm text-gray-500">{topic.recentPostCount} recent · {topic.postCount} total posts</p></div>
                  <Hash className="size-5 text-blue-500" />
                </Link>
              ))}
            </section>
          )}

          {data.feeds.length > 0 && (
            <section className="border-b-4 border-gray-100">
              <div className="flex items-center justify-between p-4"><div className="flex items-center gap-2"><SlidersHorizontal className="size-5 text-blue-500" /><h2 className="text-lg font-bold">Feeds to try</h2></div><Link href="/feeds" className="text-sm font-semibold text-blue-600">See all</Link></div>
              <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2">
                {data.feeds.map((feed) => (
                  <Link key={feed.slug} href={`/feeds/${feed.slug}`} className="rounded-xl border p-4 hover:bg-gray-50"><p className="font-bold">{feed.name}</p><p className="mt-1 line-clamp-2 text-sm text-gray-600">{feed.description}</p></Link>
                ))}
              </div>
            </section>
          )}

          {data.accounts.length > 0 && (
            <section>
              <div className="flex items-center gap-2 p-4"><Users className="size-5 text-blue-500" /><h2 className="text-lg font-bold">People to follow</h2></div>
              {data.accounts.map((account) => (
                <article key={account.id} className="flex gap-3 border-t p-4 hover:bg-gray-50">
                  <Link href={`/profile/${account.username}`}><Avatar><AvatarImage src={account.avatarUrl ?? undefined} alt={account.displayName} /><AvatarFallback>{account.displayName.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar></Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/profile/${account.username}`} className="min-w-0"><span className="flex items-center gap-1 truncate font-bold hover:underline">{account.displayName}{account.verified && <BadgeCheck className="size-4 shrink-0 text-blue-500" />}</span><span className="block truncate text-sm text-gray-500">@{account.username} · {account.followersCount.toLocaleString()} followers</span></Link>
                      <FollowButton targetUserId={account.id} />
                    </div>
                    {account.bio && <p className="mt-2 line-clamp-2 text-sm text-gray-700">{account.bio}</p>}
                  </div>
                </article>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
