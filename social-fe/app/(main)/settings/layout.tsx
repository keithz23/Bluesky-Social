"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const SETTINGS_TITLES: Record<string, string> = {
  account: "Account",
  privacy: "Privacy and security",
  moderation: "Moderation",
  notifications: "Notifications",
  content: "Content and media",
  appearance: "Appearance",
  accessibility: "Accessibility",
  languages: "Languages",
  help: "Help",
  about: "About",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const currentSection = pathname.split("/").filter(Boolean).at(-1);
  const title =
    currentSection && currentSection !== "settings"
      ? SETTINGS_TITLES[currentSection] || "Settings"
      : "Settings";

  return (
    <div className="flex min-h-[calc(100dvh-7rem)] w-full flex-col bg-white pb-20 lg:min-h-[calc(100dvh-3.5rem)]">
      <div className="sticky top-28 z-20 flex h-12 items-center border-b border-gray-200 bg-white px-4 lg:top-14">
        <button
          type="button"
          onClick={() => router.back()}
          className="-ml-2 cursor-pointer rounded-full p-2 transition hover:bg-gray-100"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <h1 className="ml-3 text-[19px] font-bold leading-none text-black">
          {title}
        </h1>
      </div>

      {children}
    </div>
  );
}
