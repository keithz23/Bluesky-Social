"use client";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full bg-white h-screen overflow-hidden">
      {children}
    </div>
  );
}
