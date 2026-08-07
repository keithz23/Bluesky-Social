"use client";

import Link from "next/link";
import { ArrowLeft, Compass, Home, Search } from "lucide-react";
import { useRouter } from "next/navigation";

function LogoMark() {
  return (
    <svg
      aria-hidden="true"
      className="h-8 w-8 text-blue-600"
      viewBox="0 0 500 500"
      fill="currentColor"
    >
      <path d="M100 100 Q 250 400 400 100 T 250 400 Z" />
    </svg>
  );
}

function LostSignalArtwork() {
  return (
    <div className="relative mx-auto h-60 w-full max-w-[400px] sm:h-72">
      <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-blue-200 sm:h-52 sm:w-52" />
      <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-100 bg-white/80 shadow-[0_24px_70px_-25px_rgba(37,99,235,0.45)] backdrop-blur-sm sm:h-32 sm:w-32">
        <div className="flex h-full flex-col items-center justify-center">
          <span className="bg-gradient-to-br from-blue-600 to-sky-400 bg-clip-text text-5xl font-black tracking-tighter text-transparent sm:text-6xl">
            404
          </span>
          <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
            Lost signal
          </span>
        </div>
      </div>

      <div className="absolute left-[9%] top-[26%] flex h-12 w-12 items-center justify-center rounded-2xl border border-white bg-[#fff0ec] text-lg shadow-lg shadow-orange-100/80 sm:h-14 sm:w-14">
        👋
      </div>
      <div className="absolute right-[8%] top-[20%] flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-violet-400 to-blue-500 text-sm shadow-lg shadow-blue-200/70 sm:h-13 sm:w-13">
        ✦
      </div>
      <div className="absolute bottom-[16%] left-[17%] flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-amber-300 to-orange-500 text-sm shadow-lg shadow-orange-200/70 sm:h-12 sm:w-12">
        ☀
      </div>
      <div className="absolute bottom-[13%] right-[16%] flex h-12 w-12 items-center justify-center rounded-2xl border border-white bg-blue-50 text-blue-600 shadow-lg shadow-blue-100 sm:h-14 sm:w-14">
        <Search className="h-5 w-5" strokeWidth={2.5} />
      </div>

      <span className="absolute left-[22%] top-[15%] h-2 w-2 rounded-full bg-blue-400" />
      <span className="absolute bottom-[23%] right-[4%] h-2.5 w-2.5 rounded-full bg-orange-400" />
      <span className="absolute right-[25%] top-[5%] text-lg text-blue-300">＋</span>
      <span className="absolute bottom-[8%] left-[38%] text-xl text-orange-300">×</span>
    </div>
  );
}

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#f8fbff] text-slate-950">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-orange-100/55 blur-3xl" />

      <header className="relative z-10 flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/70 px-5 backdrop-blur-xl sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Konekt home">
          <LogoMark />
          <span className="text-xl font-extrabold tracking-tight text-blue-700">
            Konekt
          </span>
        </Link>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 items-center gap-2 rounded-full px-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Go back</span>
        </button>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-5 py-10 text-center sm:px-8 sm:py-14">
        <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-blue-600 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
          Connection interrupted
        </div>

        <LostSignalArtwork />

        <div className="-mt-3 max-w-xl sm:-mt-5">
          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            This post has left the conversation.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
            The page may have moved, been deleted, or the link is taking the scenic route.
          </p>
        </div>

        <div className="mt-7 flex w-full max-w-sm flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <Home className="h-4 w-4" />
            Back to home
          </Link>
          <Link
            href="/explore"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <Compass className="h-4 w-4" />
            Explore Konekt
          </Link>
        </div>
      </section>

      <footer className="relative z-10 px-5 pb-6 text-center text-xs text-slate-400">
        There&apos;s always another conversation waiting for you.
      </footer>
    </main>
  );
}
