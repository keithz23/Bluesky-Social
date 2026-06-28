"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  LogOut,
  PlusSquare,
  Search,
  Settings,
  UserRound,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "../hooks/use-auth";
import { useNotifications } from "../hooks/use-notifications";
import { useDebounce } from "../hooks/use-debounce";
import { useSearchUsers } from "../hooks/use-user";
import { useSearchPosts } from "../hooks/use-post";
import type { Feed } from "../interfaces/feed.interface";
import type { User } from "../interfaces/user.interface";

function LogoMark({
  size = 28,
  className = "text-[#FF4500]",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <svg width={size} height={size} viewBox="0 0 500 500" fill="currentColor">
        <path d="M100 100 Q 250 400 400 100 T 250 400 Z" />
      </svg>
    </div>
  );
}

function getInitial(displayName?: string | null, username?: string | null) {
  return (displayName || username || "@").trim().charAt(0).toUpperCase();
}

function HeaderIconButton({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="relative rounded-full text-slate-900 hover:bg-slate-100"
    >
      <Link href={href} aria-label={label}>
        {children}
      </Link>
    </Button>
  );
}

function SearchAvatar({ user }: { user: Pick<User, "avatarUrl" | "username"> }) {
  return (
    <div className="flex h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#FF4F5A] text-sm font-bold text-white">
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.username}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          {getInitial(null, user.username)}
        </div>
      )}
    </div>
  );
}

function HeaderSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const trimmedQuery = query.trim();
  const debouncedQuery = useDebounce(trimmedQuery, 300);
  const { data: users = [], isFetching: isFetchingUsers } = useSearchUsers(
    trimmedQuery,
    4,
  );
  const { data: postPages, isFetching: isFetchingPosts } =
    useSearchPosts(debouncedQuery);

  const posts = useMemo(
    () => postPages?.pages.flatMap((page) => page.posts).slice(0, 4) ?? [],
    [postPages],
  );

  const hasQuery = trimmedQuery.length > 0;
  const hasPeople = users.length > 0;
  const hasPosts = posts.length > 0;
  const isLoading = hasQuery && (isFetchingUsers || isFetchingPosts);
  const showEmpty = hasQuery && !isLoading && !hasPeople && !hasPosts;

  const closeSearch = () => setIsOpen(false);

  const goToSearch = (tab: "people" | "posts" = "people") => {
    const params = new URLSearchParams();
    if (trimmedQuery) params.set("q", trimmedQuery);
    params.set("tab", tab);
    closeSearch();
    router.push(`/search?${params.toString()}`);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    goToSearch("people");
  };

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        closeSearch();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const preventOutsideScroll = (event: WheelEvent | TouchEvent) => {
      const target = event.target as Node;

      if (dropdownRef.current?.contains(target)) {
        return;
      }

      event.preventDefault();
    };

    document.addEventListener("wheel", preventOutsideScroll, {
      passive: false,
    });
    document.addEventListener("touchmove", preventOutsideScroll, {
      passive: false,
    });

    return () => {
      document.removeEventListener("wheel", preventOutsideScroll);
      document.removeEventListener("touchmove", preventOutsideScroll);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className="relative hidden w-full justify-self-center md:block"
    >
      <form onSubmit={handleSubmit} role="search">
        <div className="flex h-10 items-center gap-3 rounded-full bg-slate-100 px-4 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-300">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Escape") closeSearch();
            }}
            placeholder="Search Konekt"
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500"
          />
        </div>
      </form>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        >
          {!hasQuery ? (
            <div className="px-4 py-6 text-center text-sm text-slate-500">
              Search for people, posts, or hashtags.
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto py-2">
              {hasPeople && (
                <section>
                  <div className="flex items-center justify-between px-4 py-2">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      People
                    </h3>
                    <button
                      type="button"
                      onClick={() => goToSearch("people")}
                      className="text-xs font-semibold text-[#FF4500] hover:underline"
                    >
                      View all
                    </button>
                  </div>

                  {users.map((user: User) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        closeSearch();
                        router.push(`/profile/${user.username}`);
                      }}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                    >
                      <SearchAvatar user={user} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="truncate text-sm font-bold text-slate-950">
                            {user.displayName}
                          </span>
                          {user.verified && (
                            <BadgeCheck className="h-4 w-4 shrink-0 text-blue-500" />
                          )}
                        </div>
                        <p className="truncate text-sm text-slate-500">
                          @{user.username}
                        </p>
                        {user.bio && (
                          <p className="mt-1 line-clamp-2 text-sm text-slate-700">
                            {user.bio}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </section>
              )}

              {hasPeople && hasPosts && (
                <div className="my-1 border-t border-slate-100" />
              )}

              {hasPosts && (
                <section>
                  <div className="flex items-center justify-between px-4 py-2">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Posts
                    </h3>
                    <button
                      type="button"
                      onClick={() => goToSearch("posts")}
                      className="text-xs font-semibold text-[#FF4500] hover:underline"
                    >
                      View all
                    </button>
                  </div>

                  {posts.map((post: Feed) => (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => {
                        closeSearch();
                        router.push(
                          `/profile/${post.user.username}/post/${post.id}`,
                        );
                      }}
                      className="flex w-full gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                    >
                      <SearchAvatar user={post.user} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 text-sm">
                          <span className="truncate font-bold text-slate-950">
                            {post.user.displayName}
                          </span>
                          <span className="truncate text-slate-500">
                            @{post.user.username}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-700">
                          {post.content || "Media post"}
                        </p>
                      </div>
                    </button>
                  ))}
                </section>
              )}

              {isLoading && (
                <div className="px-4 py-5 text-center text-sm text-slate-500">
                  Searching...
                </div>
              )}

              {showEmpty && (
                <div className="px-4 py-6 text-center text-sm text-slate-500">
                  No results found.
                </div>
              )}
            </div>
          )}

          <div className="border-t border-slate-100 bg-slate-50 p-2">
            <button
              type="button"
              onClick={() => goToSearch("people")}
              className="block w-full rounded-xl py-2 text-center text-sm font-semibold text-[#FF4500] transition hover:bg-slate-200"
            >
              View all results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GlobalHeader() {
  const router = useRouter();
  const { user, isAuthenticated, logoutMutation } = useAuth();
  const { unreadCount } = useNotifications(isAuthenticated);

  const profileHref = user?.username ? `/profile/${user.username}` : "/profile";
  const accountInitial = getInitial(user?.displayName, user?.username);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => router.push("/login"),
    });
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 h-14 border-b border-gray-200 bg-white">
      <div className="grid h-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 md:grid-cols-[minmax(0,1fr)_minmax(16rem,36rem)_minmax(0,1fr)]">
        <Link
          href="/"
          aria-label="Konekt home"
          className="flex h-10 w-10 shrink-0 items-center justify-center justify-self-start rounded-full hover:bg-slate-100"
        >
          <LogoMark />
        </Link>

        <HeaderSearch />

        <div className="flex shrink-0 items-center gap-1.5 justify-self-end">
          <Button
            asChild
            variant="ghost"
            className="hidden rounded-full px-3 font-semibold text-slate-900 hover:bg-slate-100 md:inline-flex"
          >
            <Link href="/">
              <PlusSquare className="h-4 w-4" />
              Create
            </Link>
          </Button>

          <HeaderIconButton href="/notifications" label="Notifications">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#FF4500] ring-2 ring-white" />
            )}
          </HeaderIconButton>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Account menu"
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition hover:bg-slate-100"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user?.avatarUrl || undefined}
                      alt={user?.displayName || user?.username || "User"}
                    />
                    <AvatarFallback className="bg-[#FF4F5A] font-bold text-white">
                      {accountInitial}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl">
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href={profileHref}>
                      <UserRound className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/settings">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild className="rounded-full px-4">
              <Link href="/login">Log in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
