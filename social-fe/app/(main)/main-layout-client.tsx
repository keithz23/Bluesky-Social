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

export default function MainLayoutClient({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, isLoadingProfile } = useAuth();
  const { unreadCount } = useNotifications(isAuthenticated);
  const { unreadMessagesCount } = useUnreadMessages(isAuthenticated);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen((isOpen) => !isOpen);

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

  if (isLoadingProfile || shouldRedirectToLogin) {
    return <Loading />;
  }

  return (
    <div className={PAGE_CLASSES}>
      <GlobalHeader
        canOpenMenu={isAuthenticated}
        isMenuOpen={isMobileMenuOpen}
        onMenuToggle={toggleMobileMenu}
      />
      <div className={CONTENT_CLASSES}>
        {isAuthenticated && isMobileMenuOpen && (
          <div
            className={MOBILE_BACKDROP_CLASSES}
            onClick={closeMobileMenu}
          />
        )}

        {isAuthenticated && (
          <AuthenticatedSidebar
            isOpen={isMobileMenuOpen}
            navItems={navItems}
            pathname={pathname}
            counts={counts}
            onNavigate={closeMobileMenu}
          />
        )}

        <main className={MAIN_CONTENT_CLASSES}>
          {children}
        </main>

        {!isMobileMenuOpen && <BackToTop />}
      </div>
    </div>
  );
}
