"use client";
import { useAuth } from "@/app/hooks/use-auth";
import {
  ArrowLeft,
  UserPlus,
  User,
  Lock,
  Hand,
  Bell,
  MonitorPlay,
  PaintRoller,
  Accessibility,
  Globe,
  HelpCircle,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const { logoutMutation } = useAuth();
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
  const settingOptions = [
    {
      id: "account",
      label: "Account",
      icon: <User className="w-6 h-6 text-gray-900" />,
    },
    {
      id: "privacy",
      label: "Privacy and security",
      icon: <Lock className="w-6 h-6 text-gray-900" />,
    },
    {
      id: "moderation",
      label: "Moderation",
      icon: <Hand className="w-6 h-6 text-gray-900" />,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell className="w-6 h-6 text-gray-900" />,
    },
    {
      id: "content",
      label: "Content and media",
      icon: <MonitorPlay className="w-6 h-6 text-gray-900" />,
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: <PaintRoller className="w-6 h-6 text-gray-900" />,
    },
    {
      id: "accessibility",
      label: "Accessibility",
      icon: <Accessibility className="w-6 h-6 text-gray-900" />,
    },
    {
      id: "languages",
      label: "Languages",
      icon: <Globe className="w-6 h-6 text-gray-900" />,
    },
    {
      id: "help",
      label: "Help",
      icon: <HelpCircle className="w-6 h-6 text-gray-900" />,
    },
    {
      id: "about",
      label: "About",
      icon: <MessageSquare className="w-6 h-6 text-gray-900" />,
    },
  ];

  return (
    <div className="flex flex-col w-full bg-white min-h-screen pb-20">
      {/* --- HEADER --- */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 flex items-center p-4">
        <Link
          href="/"
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 ml-4">Settings</h1>
      </div>

      {/* --- PROFILE SUMMARY --- */}
      <div className="flex flex-col items-center justify-center pt-8 pb-6 border-b border-gray-100">
        <div className="w-17 h-17 rounded-full bg-[#FF4F5A] flex items-center justify-center text-4xl text-white font-bold mb-3 shadow-sm">
          @
        </div>
        <h2 className="text-[22px] font-extrabold text-gray-900 leading-tight">
          keithz24.bsky.social
        </h2>
        <p className="text-[15px] text-gray-500 mt-0.5">
          @keithz24.bsky.social
        </p>
      </div>

      {/* --- ADD ACCOUNT --- */}
      <div className="border-b border-gray-100">
        <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition cursor-pointer text-left">
          <UserPlus className="w-6 h-6 text-gray-900" />
          <span className="text-[16px] text-gray-900">Add another account</span>
        </button>
      </div>

      {/* --- SETTINGS MENU --- */}
      <div className="flex flex-col border-b border-gray-100">
        {settingOptions.map((item) => (
          <button
            key={item.id}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition cursor-pointer"
          >
            <div className="flex items-center gap-4">
              {item.icon}
              <span className="text-[16px] text-gray-900">{item.label}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        ))}
      </div>

      {/* --- SIGN OUT --- */}
      <div className="pt-2">
        <button
          className="w-full text-left px-5 py-4 text-[#FF4F5A] text-[15px] hover:bg-gray-50 transition cursor-pointer"
          onClick={handleLogout}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
