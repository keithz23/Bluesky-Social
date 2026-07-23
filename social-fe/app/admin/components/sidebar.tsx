"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpenCheck,
  FileWarning,
  Flag,
  Gavel,
  Home,
  KeyRound,
  ListChecks,
  LucideIcon,
  MessageSquareWarning,
  ScrollText,
  Settings,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";

export interface AdminNavItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [
      { icon: Home, label: "Dashboard", href: "/admin/dashboard" },
      { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
    ],
  },
  {
    label: "Community",
    items: [
      { icon: UsersRound, label: "Users", href: "/admin/users" },
      { icon: MessageSquareWarning, label: "Posts", href: "/admin/posts" },
      { icon: Flag, label: "Reports", href: "/admin/reports" },
      { icon: Gavel, label: "Moderation", href: "/admin/moderation" },
    ],
  },
  {
    label: "Policy",
    items: [
      { icon: BookOpenCheck, label: "Rules", href: "/admin/rules" },
      { icon: FileWarning, label: "Keywords", href: "/admin/keywords" },
    ],
  },
  {
    label: "System",
    items: [
      {
        icon: ShieldCheck,
        label: "Roles & Permissions",
        href: "/admin/roles-permissions",
      },
      { icon: ScrollText, label: "Audit logs", href: "/admin/audit-logs" },
      { icon: Settings, label: "Settings", href: "/admin/settings" },
    ],
  },
];

const isActivePath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

function AdminLogo() {
  return (
    <Link
      href="/admin/dashboard"
      className="flex h-12 items-center gap-3 rounded-md px-3 text-slate-950 transition hover:bg-slate-100"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white shadow-sm">
        K
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold leading-5">Konekt Admin</p>
        <p className="truncate text-xs text-slate-500">Control center</p>
      </div>
    </Link>
  );
}

function SidebarNavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: AdminNavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const isActive = isActivePath(pathname, item.href);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition ${
        isActive
          ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
      }`}
    >
      <item.icon
        className={`size-4 shrink-0 ${
          isActive ? "text-blue-600" : "text-slate-500"
        }`}
        strokeWidth={isActive ? 2.4 : 2}
      />
      <span className="min-w-0 truncate">{item.label}</span>
    </Link>
  );
}

function SidebarPanel({
  pathname,
  onNavigate,
  onClose,
}: {
  pathname: string;
  onNavigate: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-3">
        <AdminLogo />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close admin menu"
          className="flex size-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 lg:hidden"
        >
          <X className="size-5" />
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <div className="flex flex-col gap-5">
          {ADMIN_NAV_GROUPS.map((group) => (
            <div key={group.label} className="space-y-1.5">
              <p className="px-3 text-[11px] font-semibold uppercase text-slate-400">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <SidebarNavLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-slate-200 p-3">
        <Link
          href="/"
          className="flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
        >
          <ListChecks className="size-4 text-slate-500" />
          View public site
        </Link>
      </div>
    </div>
  );
}

export default function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname() || "";

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 border-r border-slate-200 lg:block">
        <SidebarPanel
          pathname={pathname}
          onNavigate={onClose}
          onClose={onClose}
        />
      </aside>

      {isOpen && (
        <button
          type="button"
          aria-label="Close admin menu overlay"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200 shadow-xl transition-transform duration-300 ease-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarPanel
          pathname={pathname}
          onNavigate={onClose}
          onClose={onClose}
        />
      </aside>
    </>
  );
}
