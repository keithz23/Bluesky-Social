"use client";
import { Button } from "@/components/ui/button";
import "../globals.css";
import {
  Home,
  Search,
  Bell,
  MessageCircle,
  Hash,
  List,
  Bookmark,
  User,
  Settings,
  SquarePen,
  Menu,
  CircleUser,
  Plus,
  LogOut,
  Ellipsis,
  ImageIcon,
  Smile,
  ChevronDown,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "../hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
<<<<<<< Updated upstream
import { useRouter,usePathname } from "next/navigation";
=======
import { useRouter, usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import NewPostModal from "../components/dialog/new-post-dialog";
>>>>>>> Stashed changes

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, logoutMutation } = useAuth();

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
  
  const navItems = [
    { icon: Home, label: "Home", href: "/", },
    { icon: Search, label: "Explore", href: "/explore" },
    { icon: Bell, label: "Notifications", href: "/notifications" },
    { icon: MessageCircle, label: "Chat", href: "/chat" },
    { icon: Hash, label: "Feeds", href: "/feeds" },
    { icon: List, label: "Lists", href: "/lists" },
    { icon: Bookmark, label: "Saved", href: "/saved" },
    { icon: User, label: "Profile", href: "/profile" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  const dropdownItems = [
    { icon: CircleUser, label: "Go to profile", href: "/profile" },
    { icon: Plus, label: "Add another account", href: "/login" },
    { icon: LogOut, label: "Sign out", href: "", onClick: handleLogout },
  ];

  return (
    <div className="min-h-screen bg-white flex justify-center text-slate-900 font-sans">
      {isAuthenticated ? (
        <aside className="hidden lg:flex w-75 xl:w-87.5 flex-col sticky top-0 h-screen p-4 border-r border-gray-100 overflow-y-auto">
          {/* Logo */}
          <div className="mb-4 pt-2 w-full px-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="group flex items-center justify-between p-2 bg-transparent hover:bg-gray-100 rounded-full transition-all duration-300 ease-out outline-none cursor-pointer w-full max-w-16 hover:max-w-65 overflow-hidden">
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-12 h-12 shrink-0 bg-[#FF4F5A] rounded-full flex items-center justify-center text-white text-2xl font-bold transition-transform duration-300 group-hover:scale-[0.85]">
                      @
                    </div>

                    <div className="flex flex-col items-start overflow-hidden text-left opacity-0 transition-opacity duration-300 delay-75 group-hover:opacity-100 w-30 xl:w-37.5">
                      <span className="text-base font-bold text-gray-900 truncate w-full">
                        {user?.username}
                      </span>
                      <span className="text-sm text-gray-500 truncate w-full">
                        @{user?.username}
                      </span>
                    </div>
                  </div>

                  <Ellipsis className="w-5 h-5 text-gray-600 shrink-0 mr-2 opacity-0 transition-opacity duration-300 delay-75 group-hover:opacity-100" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-60 rounded-xl">
                <DropdownMenuGroup>
                  {dropdownItems.map((di) => {
                    if (di.onClick) {
                      return (
                        <DropdownMenuItem
                          key={di.label}
                          onClick={di.onClick}
                          className="cursor-pointer py-3 px-4 flex items-center gap-3"
                        >
                          <di.icon
                            className="w-5 h-5 text-black"
                            strokeWidth={2}
                          />
                          <span className="text-base font-medium text-black">
                            {di.label}
                          </span>
                        </DropdownMenuItem>
                      );
                    }

                    return (
                      <Link href={di.href} key={di.label}>
                        <DropdownMenuItem className="cursor-pointer py-3 px-4 flex items-center gap-3">
                          <di.icon
                            className="w-5 h-5 text-black"
                            strokeWidth={2}
                          />
                          <span className="text-base font-medium text-black">
                            {di.label}
                          </span>
                        </DropdownMenuItem>
                      </Link>
                    );
                  })}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Navigation Menu */}
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-5 p-3 rounded-full hover:bg-gray-100 transition max-w-xl pr-8"
              >
                <item.icon
                  className="w-7 h-7 text-black"
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                <span
                  className={`text-xl text-black ${isActive ? "font-bold" : ""}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* New Post */}
          <NewPostModal />
        </aside>
      ) : (
        <aside className="hidden lg:flex w-75 xl:w-87.5 flex-col sticky top-0 h-screen p-6 border-r border-gray-100 overflow-y-auto">
          <div className="mb-6 text-sky-500">
            <svg
              width="40"
              height="40"
              viewBox="0 0 500 500"
              fill="currentColor"
            >
              <path d="M100 100 Q 250 400 400 100 T 250 400 Z" />
            </svg>
          </div>

          <div className="mb-8">
            <h1 className="text-xl font-extrabold mb-4">
              Join the
              <br />
              conversation
            </h1>
            <div className="flex flex-col gap-3">
              <Link href={"/signup"}>
                <Button className="cursor-pointer w-full rounded-full">
                  Create account
                </Button>
              </Link>
              <Link href={"/login"}>
                <Button
                  variant="outline"
                  className="cursor-pointer w-full rounded-full"
                >
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </aside>
      )}

      {/* --- MAIN CONTENT --- */}
      <main className="w-full max-w-150 border-r border-gray-100 min-h-screen pb-20 md:pb-0">
        <header className="lg:hidden sticky top-0 z-50 flex items-center justify-center w-full h-14 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4">
          <button className="absolute left-4 p-2 -ml-2 rounded-full hover:bg-gray-100 transition text-sky-500 cursor-pointer">
            <Menu className="w-7 h-7" />
          </button>

          {/* Logo */}
          <div
            className="text-sky-500 curso%r-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 500 500"
              fill="currentColor"
            >
              <path d="M100 100 Q 250 400 400 100 T 250 400 Z" />
            </svg>
          </div>

          {/* <div className="absolute right-4 text-sky-500 font-bold text-sm">Sign in</div> */}
        </header>

        {children}
      </main>

      {/* --- SIDEBAR right (Desktop Only) --- */}
      <aside className="hidden lg:block w-87.5 pl-8 shrink-0">
        <div className="sticky top-0 h-screen py-4 pr-4 overflow-y-auto">
          {/* Search Box */}
          <div className="relative group mb-6">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500" />
            </div>
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-gray-100 border-none rounded-full py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Trending Box */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-900">Trending</h3>
              <span className="text-blue-500 text-xs font-bold cursor-pointer hover:underline">
                More
              </span>
            </div>

            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className="cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1 rounded-md transition"
                >
                  <div className="text-xs font-bold text-gray-500">
                    {n}.{" "}
                    {[
                      "X-Files",
                      "Music Challenge",
                      "Olympic Hockey",
                      "Tech News",
                      "ReactJS",
                    ][n - 1] || "Trending Topic"}
                  </div>
                  <div className="text-sm font-bold text-gray-900 mt-0.5">
                    Topic Name {n}
                  </div>
                  <div className="text-xs text-gray-500">15.4k posts</div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
              <a href="#" className="hover:underline">
                Privacy
              </a>
              <a href="#" className="hover:underline">
                Terms
              </a>
              <a href="#" className="hover:underline">
                Help
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* --- BOTTOM CALL TO ACTION (Mobile Only) --- */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 safe-area-bottom">
        <div className="flex items-center justify-between max-w-150 mx-auto">
          {/* Logo + Brand */}
          <div className="flex items-center gap-2">
            <div className="text-sky-500">
              <svg
                width="32"
                height="32"
                viewBox="0 0 500 500"
                fill="currentColor"
              >
                <path d="M100 100 Q 250 400 400 100 T 250 400 Z" />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight">Bluesky</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Link href="/signup">
              <button className="bg-blue-600 text-white text-sm font-bold py-2 px-4 rounded-full">
                Create account
              </button>
            </Link>
            <Link href="/login">
              <button className="bg-gray-100 text-gray-900 text-sm font-bold py-2 px-4 rounded-full">
                Sign in
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
