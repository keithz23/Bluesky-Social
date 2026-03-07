"use client";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col w-full bg-white min-h-screen pb-20">
      {children}
    </div>
  );
}
