"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronRight,
  ExternalLink,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/app/hooks/use-auth";
import { ADMIN_NAV_GROUPS } from "./sidebar";

type GlobalHeaderProps = {
  isMenuOpen: boolean;
  onMenuToggle: () => void;
};

function getInitial(displayName?: string | null, username?: string | null) {
  return (displayName || username || "A").trim().charAt(0).toUpperCase();
}

function getPageMeta(pathname: string) {
  const activeItem = ADMIN_NAV_GROUPS.flatMap((group) => group.items).find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  if (activeItem) {
    return {
      title: activeItem.label,
      eyebrow: "Admin",
    };
  }

  return {
    title: "Dashboard",
    eyebrow: "Admin",
  };
}

export default function AdminGlobalHeader({
  isMenuOpen,
  onMenuToggle,
}: GlobalHeaderProps) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { user, isAuthenticated, logoutMutation } = useAuth();
  const pageMeta = getPageMeta(pathname);
  const accountInitial = getInitial(user?.displayName, user?.username);
  const profileHref = user?.username
    ? `/profile/${user.username}`
    : "/settings/account";

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        router.replace("/admin/login");
      },
    });
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 h-16 border-b border-slate-200 bg-white/95 backdrop-blur lg:left-72">
      <div className="flex h-full items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            aria-label={isMenuOpen ? "Close admin menu" : "Open admin menu"}
            aria-expanded={isMenuOpen}
            className="flex size-10 shrink-0 items-center justify-center rounded-md text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 lg:hidden"
          >
            <Menu className="size-5" />
          </button>

          <div className="min-w-0">
            <div className="hidden items-center gap-1 text-xs font-medium text-slate-500 sm:flex">
              <span>{pageMeta.eyebrow}</span>
              <ChevronRight className="size-3.5" />
              <span className="truncate">{pageMeta.title}</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden h-9 rounded-md border-slate-200 bg-white px-3 text-slate-700 hover:bg-slate-50 md:inline-flex"
          >
            <Link href="/">
              <ExternalLink className="size-4" />
              View site
            </Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            size="icon"
            className="relative size-10 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-950"
          >
            <Link href="/admin/reports" aria-label="Open admin reports">
              <Bell className="size-5" />
              <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-blue-600 ring-2 ring-white" />
            </Link>
          </Button>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Admin account menu"
                  className="flex h-10 items-center gap-2 rounded-md px-1.5 transition hover:bg-slate-100 sm:pl-2 sm:pr-3"
                >
                  <Avatar className="size-8">
                    <AvatarImage
                      src={user?.avatarUrl || undefined}
                      alt={user?.displayName || user?.username || "Admin"}
                    />
                    <AvatarFallback className="bg-blue-600 text-xs font-bold text-white">
                      {accountInitial}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-32 truncate text-sm font-medium text-slate-800 sm:block">
                    {user?.displayName || user?.username || "Admin"}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-md">
                <DropdownMenuLabel>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {user?.displayName || user?.username || "Admin"}
                    </p>
                    <p className="truncate text-xs font-normal text-slate-500">
                      {user?.email || "Administrator"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href={profileHref}>
                      <UserRound className="size-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/admin/settings">
                      <Settings className="size-4" />
                      Admin settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/admin/roles">
                      <ShieldCheck className="size-4" />
                      Roles and access
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="h-9 rounded-md px-3">
              <Link href="/admin/login">Log in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
