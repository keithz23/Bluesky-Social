"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Bookmark,
  CircleUser,
  Ellipsis,
  Hash,
  Home,
  List,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Settings,
  User,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "../hooks/use-auth";
import { useNotifications } from "../hooks/use-notifications";
import { useUnreadMessages } from "../hooks/use-unread-messages";
import BackToTop from "../components/back-to-top";
import Loading from "../components/loading";
import NewPostModal from "../components/dialog/new-post-dialog";
import GlobalHeader from "../components/global-header";

type NavItem = {
  icon: LucideIcon;
  label: string;
  href: string;
};

type DropdownItem = NavItem & {
  onClick?: () => void;
};

type BadgeCounts = {
  notifications: number;
  messages: number;
};

const PAGE_CLASSES = "relative min-h-screen bg-white font-sans text-slate-900";
const CONTENT_CLASSES =
  "min-h-[calc(100dvh-3.5rem)] pt-14";
const SIDEBAR_CLASSES =
  "fixed left-0 top-14 z-40 flex h-[calc(100dvh-3.5rem)] w-75 flex-col overflow-hidden border-r border-gray-100 bg-white p-4 transition-transform duration-300 ease-in-out xl:w-87.5 lg:translate-x-0";
const MOBILE_BACKDROP_CLASSES =
  "fixed inset-x-0 bottom-0 top-14 z-30 bg-black/50 transition-opacity lg:hidden";
const MAIN_CONTENT_CLASSES =
  "min-h-[calc(100dvh-3.5rem)] w-full pb-20 md:pb-0 lg:mx-auto lg:max-w-[min(960px,calc(100vw-46rem))]";

const isActivePath = (pathname: string, href: string) =>
  pathname === href || (href !== "/" && pathname.startsWith(href));

const formatBadgeCount = (count: number) => (count > 99 ? "99+" : count);

const getBadgeCount = (label: string, counts: BadgeCounts) => {
  if (label === "Notifications") return counts.notifications;
  if (label === "Chat") return counts.messages;
  return 0;
};

function LogoMark({
  size = 32,
  className = "text-blue-500",
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

function Badge({ count, mobile = false }: { count: number; mobile?: boolean }) {
  if (count <= 0) return null;

  return (
    <span
      className={
        mobile
          ? "absolute -right-2 -top-2 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#E42240] px-1 text-[10px] font-bold leading-none text-white"
          : "absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E42240] px-1 text-[11px] font-bold leading-none text-white"
      }
    >
      {formatBadgeCount(count)}
    </span>
  );
}


function SidebarNavLink({
  item,
  pathname,
  counts,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  counts: BadgeCounts;
  onNavigate: () => void;
}) {
  const isActive = isActivePath(pathname, item.href);
  const badgeCount = getBadgeCount(item.label, counts);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className="flex max-w-xl items-center gap-5 rounded-full p-3 pr-8 transition hover:bg-gray-100"
    >
      <span className="relative">
        <item.icon
          className="h-7 w-7 text-black"
          strokeWidth={isActive ? 2.5 : 1.5}
        />
        <Badge count={badgeCount} />
      </span>
      <span className={`text-xl text-black ${isActive ? "font-bold" : ""}`}>
        {item.label}
      </span>
    </Link>
  );
}

function AuthenticatedSidebar({
  isOpen,
  navItems,
  dropdownItems,
  pathname,
  counts,
  user,
  onNavigate,
}: {
  isOpen: boolean;
  navItems: NavItem[];
  dropdownItems: DropdownItem[];
  pathname: string;
  counts: BadgeCounts;
  user?: { displayName?: string | null; username?: string | null } | null;
  onNavigate: () => void;
}) {
  return (
    <aside
      className={`${SIDEBAR_CLASSES} ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      {navItems.map((item) => (
        <SidebarNavLink
          key={item.label}
          item={item}
          pathname={pathname}
          counts={counts}
          onNavigate={onNavigate}
        />
      ))}

      <NewPostModal buttonName="New Post" />
    </aside>
  );
}

function GuestSidebar({
  isOpen,
  onNavigate,
}: {
  isOpen: boolean;
  onNavigate: () => void;
}) {
  return (
    <aside
      className={`${SIDEBAR_CLASSES} ${isOpen ? "translate-x-0" : "-translate-x-full"} p-6`}
    >
      <div className="mb-6">
        <LogoMark size={40} />
      </div>

      <div className="mb-8">
        <h1 className="mb-4 text-xl font-extrabold">
          Join the
          <br />
          conversation
        </h1>
        <div className="flex flex-col gap-3">
          <Button asChild className="w-full cursor-pointer rounded-full">
            <Link href="/signup" onClick={onNavigate}>
              Create account
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full cursor-pointer rounded-full"
          >
            <Link href="/login" onClick={onNavigate}>
              Sign in
            </Link>
          </Button>
        </div>
      </div>
    </aside>
  );
}

function MobileHeader({
  onMenuOpen,
  onScrollTop,
}: {
  onMenuOpen: () => void;
  onScrollTop: () => void;
}) {
  return (
    <header className="sticky top-14 z-20 flex h-14 w-full items-center justify-center border-b border-gray-100 bg-white/80 px-4 backdrop-blur-md lg:hidden">
      <button
        onClick={onMenuOpen}
        className="absolute left-4 -ml-2 cursor-pointer rounded-full p-2 text-blue-500 transition hover:bg-gray-100"
      >
        <Menu className="h-7 w-7" />
      </button>

      <button
        type="button"
        className="cursor-pointer"
        onClick={onScrollTop}
        aria-label="Scroll to top"
      >
        <LogoMark />
      </button>
    </header>
  );
}

function MobileBottomNav({
  isAuthenticated,
  navItems,
  pathname,
  counts,
}: {
  isAuthenticated: boolean;
  navItems: NavItem[];
  pathname: string;
  counts: BadgeCounts;
}) {
  return (
    <div className="pb-safe fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex h-14 w-full max-w-md items-center justify-center px-4">
        {isAuthenticated ? (
          <div className="flex w-full items-center justify-between px-2">
            {navItems.map((item) => {
              const isActive = isActivePath(pathname, item.href);
              const badgeCount = getBadgeCount(item.label, counts);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-center rounded-full p-2.5 transition-colors hover:bg-gray-100"
                  aria-label={item.label}
                >
                  <span className="relative">
                    <item.icon
                      className="h-6.5 w-6.5 text-gray-900"
                      strokeWidth={isActive ? 2.5 : 1.5}
                    />
                    <Badge count={badgeCount} mobile />
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex w-full items-center justify-between">
            <LogoMark size={28} className="text-[#1185fe]" />

            <div className="flex items-center gap-2.5">
              <Link href="/signup">
                <button className="rounded-full bg-[#1185fe] px-4 py-1.5 text-[14px] font-bold text-white transition-colors hover:bg-blue-600">
                  Create account
                </button>
              </Link>
              <Link href="/login">
                <button className="rounded-full bg-gray-100 px-4 py-1.5 text-[14px] font-bold text-gray-900 transition-colors hover:bg-gray-200">
                  Sign in
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MainLayoutClient({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, logoutMutation, isLoadingProfile } = useAuth();
  const { unreadCount } = useNotifications(isAuthenticated);
  const { unreadMessagesCount } = useUnreadMessages(isAuthenticated);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const scrollMainToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        router.push("/login");
      },
      onError: (error: Error) => {
        console.error(`Logout error: ${error.message}`);
      },
    });
  };

  const navItems: NavItem[] = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Search, label: "Explore", href: "/explore" },
    { icon: Bell, label: "Notifications", href: "/notifications" },
    { icon: MessageCircle, label: "Chat", href: "/chat" },
    { icon: Hash, label: "Feeds", href: "/feeds" },
    { icon: List, label: "Lists", href: "/lists" },
    { icon: Bookmark, label: "Saved", href: "/saved" },
    {
      icon: User,
      label: "Profile",
      href: user ? `/profile/${user.username}` : "/profile",
    },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  const mobileNavItems: NavItem[] = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Search, label: "Explore", href: "/explore" },
    { icon: MessageCircle, label: "Chat", href: "/chat" },
    { icon: Bell, label: "Notifications", href: "/notifications" },
    {
      icon: User,
      label: "Profile",
      href: user ? `/profile/${user.username}` : "/profile",
    },
  ];

  const dropdownItems: DropdownItem[] = [
    {
      icon: CircleUser,
      label: "Go to profile",
      href: user ? `/profile/${user.username}` : "/profile",
    },
    { icon: Plus, label: "Add another account", href: "/login" },
    { icon: LogOut, label: "Sign out", href: "", onClick: handleLogout },
  ];

  const counts = {
    notifications: unreadCount,
    messages: unreadMessagesCount,
  };

  if (isLoadingProfile) {
    return <Loading />;
  }

  return (
    <div className={PAGE_CLASSES}>
      <GlobalHeader />
      <div className={CONTENT_CLASSES}>
        {isMobileMenuOpen && (
          <div
            className={MOBILE_BACKDROP_CLASSES}
            onClick={closeMobileMenu}
          />
        )}

        {isAuthenticated ? (
          <AuthenticatedSidebar
            isOpen={isMobileMenuOpen}
            navItems={navItems}
            dropdownItems={dropdownItems}
            pathname={pathname}
            counts={counts}
            user={user}
            onNavigate={closeMobileMenu}
          />
        ) : (
          <GuestSidebar
            isOpen={isMobileMenuOpen}
            onNavigate={closeMobileMenu}
          />
        )}

        <main className={MAIN_CONTENT_CLASSES}>
          <MobileHeader
            onMenuOpen={() => setIsMobileMenuOpen(true)}
            onScrollTop={scrollMainToTop}
          />
          {children}
        </main>

        {!isMobileMenuOpen && (
          <MobileBottomNav
            isAuthenticated={isAuthenticated}
            navItems={mobileNavItems}
            pathname={pathname}
            counts={counts}
          />
        )}

        {!isMobileMenuOpen && <BackToTop />}
      </div>
    </div>
  );
}
