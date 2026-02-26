"use client";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <div className="w-30 h-30">
        <DotLottieReact src="/loading.lottie" loop autoplay />
      </div>
    </div>
  );
}
