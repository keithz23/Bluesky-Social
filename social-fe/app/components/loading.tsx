"use client";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-white">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-blue-400 opacity-30 animate-ping"></div>
        <div className="absolute inset-0 rounded-full border-4 border-blue-500"></div>
      </div>
    </div>
  );
}