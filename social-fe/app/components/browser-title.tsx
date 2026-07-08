"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const APP_NAME = "Konekt";

const STATIC_TITLES: Record<string, string> = {
  "/": "Home",
  "/login": "Login",
  "/signup": "Sign up",
  "/forgot": "Forgot password",
  "/password-updated": "Password updated",
  "/explore": "Explore",
  "/feeds": "Feeds",
  "/lists": "Lists",
  "/notifications": "Notifications",
  "/saved": "Saved",
  "/search": "Search",
  "/settings": "Settings",
  "/settings/about": "About",
  "/settings/accessibility": "Accessibility",
  "/settings/account": "Account settings",
  "/settings/appearance": "Appearance",
  "/settings/content": "Content settings",
  "/settings/help": "Help",
  "/settings/languages": "Languages",
  "/settings/moderation": "Moderation",
  "/settings/notifications": "Notification settings",
  "/settings/privacy": "Privacy",
  "/chat": "Chat",
  "/chat/settings": "Chat settings",
};

const PROFILE_SECTION_TITLES: Record<string, string> = {
  feeds: "Feeds",
  followers: "Followers",
  follows: "Following",
  likes: "Likes",
  lists: "Lists",
  media: "Media",
  replies: "Replies",
  "starter-packs": "Starter packs",
  videos: "Videos",
};

const formatSegment = (segment: string) => {
  const decoded = decodeURIComponent(segment);
  return decoded
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const withAppName = (title: string) => `${title} | ${APP_NAME}`;

const getProfileTitle = (segments: string[]) => {
  const username = segments[1];
  const section = segments[2];

  if (!username) return "Profile";
  if (!section) return `@${decodeURIComponent(username)}`;
  if (section === "post") return `@${decodeURIComponent(username)} Post`;
  if (section === "lists" && segments[3]) {
    return `@${decodeURIComponent(username)} List`;
  }

  return `@${decodeURIComponent(username)} ${
    PROFILE_SECTION_TITLES[section] ?? formatSegment(section)
  }`;
};

const getRouteTitle = (pathname: string, query: string | null) => {
  if (pathname === "/search" && query) {
    return `Search: ${query}`;
  }

  const staticTitle = STATIC_TITLES[pathname];
  if (staticTitle) return staticTitle;

  const segments = pathname.split("/").filter(Boolean);
  const [section, subSection] = segments;

  if (section === "profile") return getProfileTitle(segments);
  if (section === "chat" && subSection) return "Chat";
  if (section === "lists" && subSection) return "List";

  return segments.length > 0 ? formatSegment(segments.at(-1) ?? "") : APP_NAME;
};

export default function BrowserTitle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() || null;

  const title = useMemo(
    () => withAppName(getRouteTitle(pathname, query)),
    [pathname, query],
  );

  useEffect(() => {
    document.title = title;
  }, [title]);

  return null;
}
