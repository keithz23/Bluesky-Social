"use client";

import {
  Accessibility,
  Bell,
  ChevronRight,
  Globe,
  Hand,
  HelpCircle,
  Lock,
  MessageSquare,
  MonitorPlay,
  PaintRoller,
  User,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/hooks/use-auth";
import Link from "next/link";

const settingSections = [
  { id: "account", label: "Account", icon: User, href: "/settings/account" },
  {
    id: "privacy",
    label: "Privacy and Security",
    icon: Lock,
    href: "/settings/privacy",
  },
  {
    id: "moderation",
    label: "Moderation and content filters",
    icon: Hand,
    href: "/settings/moderation",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    href: "/settings/notifications",
  },
  {
    id: "content",
    label: "Content and media",
    icon: MonitorPlay,
    href: "/settings/content",
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: PaintRoller,
    href: "/settings/appearance",
  },
  {
    id: "accessibility",
    label: "Accessibility",
    icon: Accessibility,
    href: "/settings/accessibility",
  },
  { id: "languages", label: "Languages", icon: Globe, href: "/settings/languages" },
  { id: "help", label: "Help", icon: HelpCircle, href: "/settings/help" },
  { id: "about", label: "About", icon: MessageSquare, href: "/settings/about" },
];

export default function SettingsPage() {
  const { logoutMutation, user } = useAuth();

  const displayName = user?.displayName || user?.username || "Your account";
  const handle = user?.username ? `@${user.username}` : user?.email || "";

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex w-full flex-col bg-white">
      <section className="flex flex-col items-center border-b border-gray-200 px-5 pb-6 pt-6 text-center">
        {user?.avatarUrl ? (
          <div className="mb-3 flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full text-4xl font-bold text-white shadow-sm">
            <img
              src={user.avatarUrl}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="mb-3 flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FF4F5A] text-4xl font-bold text-white shadow-sm">
            @
          </div>
        )}

        <h2 className="max-w-full truncate text-[30px] font-extrabold leading-tight text-black">
          {displayName}
        </h2>
        {handle && (
          <p className="max-w-full truncate text-[16px] leading-tight text-slate-600">
            {handle}
          </p>
        )}
      </section>

      <section>
        <button
          type="button"
          onClick={() =>
            toast.info("Multi-account support is not available yet")
          }
          className="flex h-14 w-full cursor-pointer items-center gap-3 px-5 text-left transition hover:bg-gray-50"
        >
          <UserPlus className="h-5 w-5 text-black" strokeWidth={2.2} />
          <span className="text-[16px] font-normal text-black">
            Add another account
          </span>
        </button>
      </section>

      <section className="flex flex-col border-y border-gray-200 py-2">
        {settingSections.map((item) => {
          const Icon = item.icon;

          return (
            <Link href={item.href} key={item.id}>
              <button
                type="button"
                className="flex h-12 w-full cursor-pointer items-center justify-between gap-4 px-5 text-left transition hover:bg-gray-50"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <Icon
                    className="h-5 w-5 shrink-0 text-black"
                    strokeWidth={2.2}
                  />
                  <span className="truncate text-[16px] font-normal text-black">
                    {item.label}
                  </span>
                </div>
                <ChevronRight
                  className="h-5 w-5 shrink-0 text-slate-500"
                  strokeWidth={1.8}
                />
              </button>
            </Link>
          );
        })}
      </section>

      <section>
        <button
          type="button"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="flex h-15 w-full cursor-pointer items-center px-4 text-left text-[#F4214B] transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span className="text-[16px] font-normal">
            {logoutMutation.isPending ? "Signing out..." : "Sign out"}
          </span>
        </button>
      </section>
    </div>
  );
}
