"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Film, Flame, Heart, ImageIcon, Pin, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { FeedCatalogItem } from "@/app/interfaces/discovery.interface";
import { useFeedCatalog, useTogglePinnedFeed } from "@/app/hooks/use-feed-catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const icons = { Flame, Users, Heart, Image: ImageIcon, Film };
const colors = {
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  rose: "bg-rose-500",
  violet: "bg-violet-500",
  slate: "bg-slate-700",
};

function FeedRow({ feed }: { feed: FeedCatalogItem }) {
  const togglePin = useTogglePinnedFeed();
  const Icon = icons[feed.icon];

  const handlePin = () => {
    togglePin.mutate(
      { slug: feed.slug, pin: !feed.isPinned },
      {
        onSuccess: () => toast.success(feed.isPinned ? "Feed unpinned" : "Feed pinned"),
        onError: () => toast.error("Could not update this feed"),
      },
    );
  };

  return (
    <article className="flex gap-3 border-b border-gray-100 p-4 transition hover:bg-gray-50">
      <Link href={`/feeds/${feed.slug}`} className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-white ${colors[feed.color]}`}>
        <Icon className="size-6" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/feeds/${feed.slug}`} className="font-bold text-gray-900 hover:underline">
            {feed.name}
          </Link>
          <Button size="sm" variant={feed.isPinned ? "outline" : "default"} disabled={togglePin.isPending} onClick={handlePin}>
            <Pin className="size-4" /> {feed.isPinned ? "Unpin" : "Pin"}
          </Button>
        </div>
        <p className="mt-1 text-sm leading-6 text-gray-600">{feed.description}</p>
      </div>
    </article>
  );
}

export default function FeedsPage() {
  const [search, setSearch] = useState("");
  const { data: feeds = [], isLoading, isError, refetch } = useFeedCatalog();
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? feeds.filter((feed) => `${feed.name} ${feed.description}`.toLowerCase().includes(q))
      : feeds;
  }, [feeds, search]);
  const pinned = feeds.filter((feed) => feed.isPinned);

  return (
    <div className="flex min-h-[calc(100dvh-7rem)] w-full flex-col bg-white pb-20">
      <header className="sticky top-14 z-20 border-b bg-white/90 p-4 backdrop-blur-md">
        <h1 className="text-xl font-bold text-gray-900">Feeds</h1>
        <p className="mt-1 text-sm text-gray-500">Choose and pin the timelines you want close at hand.</p>
      </header>

      {pinned.length > 0 && (
        <section className="border-b-4 border-gray-100">
          <h2 className="px-4 pt-4 text-lg font-bold">My Feeds</h2>
          <div className="flex gap-3 overflow-x-auto p-4">
            {pinned.map((feed) => {
              const Icon = icons[feed.icon];
              return (
                <Link key={feed.slug} href={`/feeds/${feed.slug}`} className="flex min-w-28 flex-col items-center gap-2 rounded-xl border p-3 text-center hover:bg-gray-50">
                  <span className={`flex size-10 items-center justify-center rounded-lg text-white ${colors[feed.color]}`}><Icon className="size-5" /></span>
                  <span className="text-sm font-semibold">{feed.name}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <div className="border-b p-4">
          <h2 className="text-lg font-bold">Discover feeds</h2>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search feeds" className="pl-9" />
          </div>
        </div>
        {isLoading && <div className="space-y-3 p-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24 w-full" />)}</div>}
        {isError && <div className="p-8 text-center"><p className="text-gray-600">Could not load feeds.</p><Button className="mt-3" onClick={() => refetch()}>Try again</Button></div>}
        {!isLoading && !isError && filtered.map((feed) => <FeedRow key={feed.slug} feed={feed} />)}
        {!isLoading && filtered.length === 0 && <p className="p-8 text-center text-gray-500">No feeds match “{search}”.</p>}
      </section>
    </div>
  );
}
