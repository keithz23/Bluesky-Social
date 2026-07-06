"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  Bookmark,
  Hash,
  Home,
  List,
  MessageCircle,
  Search,
  Settings,
  User,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

type BadgeCounts = {
  notifications: number;
  messages: number;
};

const PAGE_CLASSES = "relative min-h-screen bg-white font-sans text-slate-900";
const CONTENT_CLASSES = "min-h-[calc(100dvh-3.5rem)] pt-14";
const SIDEBAR_BASE_CLASSES =
  "fixed left-0 top-14 z-40 flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden border-r border-slate-200 bg-[#f6fafc] px-2 py-3 transition-[transform,width] duration-300 ease-in-out";
const MOBILE_BACKDROP_CLASSES =
  "fixed inset-x-0 bottom-0 top-14 z-30 bg-black/50 transition-opacity lg:hidden";
const MAIN_BASE_CLASSES =
  "mx-auto min-h-[calc(100dvh-3.5rem)] w-full max-w-[860px] pb-20 transition-[margin] duration-300 md:pb-0";

const getSidebarClasses = (isExpanded: boolean) =>
  `${SIDEBAR_BASE_CLASSES} ${
    isExpanded
      ? "w-60 translate-x-0 lg:w-56 xl:w-60"
      : "-translate-x-full lg:w-16 lg:translate-x-0"
  }`;

const getMainContentClasses = (isSidebarExpanded: boolean) =>
  `${MAIN_BASE_CLASSES} ${
    isSidebarExpanded
      ? "lg:ml-[max(14rem,calc(14rem+(100vw-14rem-860px)/2))] xl:ml-[max(15rem,calc(15rem+(100vw-15rem-860px)/2))]"
      : "lg:ml-[max(4rem,calc(4rem+(100vw-4rem-860px)/2))]"
  }`;

const isActivePath = (pathname: string, href: string) =>
  pathname === href || (href !== "/" && pathname.startsWith(href));

const formatBadgeCount = (count: number) => (count > 99 ? "99+" : count);

const getBadgeCount = (label: string, counts: BadgeCounts) => {
  if (label === "Notifications") return counts.notifications;
  if (label === "Chat") return counts.messages;
  return 0;
};

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
  isExpanded,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  counts: BadgeCounts;
  isExpanded: boolean;
  onNavigate: () => void;
}) {
  const isActive = isActivePath(pathname, item.href);
  const badgeCount = getBadgeCount(item.label, counts);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={item.label}
      className={`group flex h-9 items-center gap-2.5 rounded-xl px-2.5 text-[13px] font-medium transition hover:bg-slate-200/80 ${
        isActive ? "bg-slate-200 text-blue-700" : "text-slate-950"
      } ${isExpanded ? "justify-start" : "justify-center lg:px-0"}`}
    >
      <span className="relative">
        <item.icon
          className={`h-4 w-4 ${isActive ? "text-blue-700" : "text-slate-950"}`}
          strokeWidth={isActive ? 2.5 : 2}
        />
        <Badge count={badgeCount} />
      </span>
      <span
        className={`min-w-0 truncate transition-opacity ${
          isExpanded ? "opacity-100" : "hidden opacity-0"
        } ${isActive ? "font-semibold" : ""}`}
      >
        {item.label}
      </span>
    </Link>
  );
}

function AuthenticatedSidebar({
  isOpen,
  navItems,
  pathname,
  counts,
  onNavigate,
}: {
  isOpen: boolean;
  navItems: NavItem[];
  pathname: string;
  counts: BadgeCounts;
  onNavigate: () => void;
}) {
  return (
    <aside className={getSidebarClasses(isOpen)}>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <SidebarNavLink
            key={item.label}
            item={item}
            pathname={pathname}
            counts={counts}
            isExpanded={isOpen}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {isOpen && (
        <div className="mt-2 border-t border-slate-200 pt-1">
          <NewPostModal buttonName="New Post" compactTrigger />
        </div>
      )}
    </aside>
  );
}

export default function MainLayoutClient({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, isLoadingProfile } = useAuth();
  const { unreadCount } = useNotifications(isAuthenticated);
  const { unreadMessagesCount } = useUnreadMessages(isAuthenticated);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const closeSidebar = () => setIsSidebarExpanded(false);
  const closeSidebarOnNavigate = () => {
    if (window.innerWidth < 1024) {
      setIsSidebarExpanded(false);
    }
  };
  const toggleSidebar = () => setIsSidebarExpanded((isOpen) => !isOpen);

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

  const counts = {
    notifications: unreadCount,
    messages: unreadMessagesCount,
  };
  const isPublicRoute = pathname === "/";
  const shouldRedirectToLogin =
    !isLoadingProfile && !isAuthenticated && !isPublicRoute;

  useEffect(() => {
    if (shouldRedirectToLogin) {
      router.replace("/login");
      router.refresh();
    }
  }, [router, shouldRedirectToLogin]);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const syncSidebarForViewport = () => {
      setIsSidebarExpanded(desktopQuery.matches);
    };

    syncSidebarForViewport();
    desktopQuery.addEventListener("change", syncSidebarForViewport);

    return () => {
      desktopQuery.removeEventListener("change", syncSidebarForViewport);
    };
  }, []);

  if (isLoadingProfile || shouldRedirectToLogin) {
    return <Loading />;
  }

  return (
    <div className={PAGE_CLASSES}>
      <GlobalHeader
        canOpenMenu={isAuthenticated}
        isMenuOpen={isSidebarExpanded}
        onMenuToggle={toggleSidebar}
      />
      <div className={CONTENT_CLASSES}>
        {isAuthenticated && isSidebarExpanded && (
          <div
            className={MOBILE_BACKDROP_CLASSES}
            onClick={closeSidebar}
          />
        )}

        {isAuthenticated && (
          <AuthenticatedSidebar
            isOpen={isSidebarExpanded}
            navItems={navItems}
            pathname={pathname}
            counts={counts}
            onNavigate={closeSidebarOnNavigate}
          />
        )}

        <main className={getMainContentClasses(isSidebarExpanded)}>
          {children}
        </main>

        {!isSidebarExpanded && <BackToTop />}
      </div>
    </div>
  );
}
