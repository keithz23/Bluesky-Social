"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => console.error("Unhandled route error", error), [error]);

  return (
    <html lang="en"><body className="grid min-h-screen place-items-center bg-slate-50 p-6 text-slate-900">
      <main className="max-w-md text-center"><h1 className="text-2xl font-bold">Something went wrong</h1><p className="mt-2 text-slate-600">Please try again. If the problem persists, return to the home page.</p><div className="mt-6 flex justify-center gap-3"><Button onClick={reset}>Try again</Button><Button variant="outline" onClick={() => (window.location.href = "/")}>Home</Button></div></main>
    </body></html>
  );
}
