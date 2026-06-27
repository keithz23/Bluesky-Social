"use client";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-[calc(100dvh-7rem)] w-full overflow-hidden bg-white lg:h-[calc(100dvh-3.5rem)]">
      {children}
    </div>
  );
}
