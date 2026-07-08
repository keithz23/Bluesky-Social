"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
};

const patternItems = Array.from({ length: 42 }, (_, index) => index);

export default function AuthShell({
  title,
  description,
  children,
  className,
}: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white px-4 py-8 text-slate-950">
      <div className="pointer-events-none absolute inset-0 grid grid-cols-4 gap-6 opacity-70 sm:grid-cols-6 lg:grid-cols-8">
        {patternItems.map((item) => (
          <div
            key={item}
            className={cn(
              "h-24 bg-slate-100/70",
              item % 7 === 0 && "rounded-[28px]",
              item % 7 === 1 && "rounded-full",
              item % 7 === 2 && "rounded-[36px] rounded-br-sm",
              item % 7 === 3 && "rounded-[32px] rounded-bl-sm",
              item % 7 === 4 && "h-40 rounded-[34px]",
              item % 7 === 5 && "h-16 rounded-full",
              item % 7 === 6 && "rounded-[44px] rounded-tr-sm",
            )}
          />
        ))}
      </div>

      <div className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <section
          className={cn(
            "w-full max-w-132.5 rounded-2xl border border-slate-200 bg-white px-6 py-10 shadow-[0_3px_14px_rgba(15,23,42,0.18)] sm:px-20",
            className,
          )}
        >
          <div className="mb-5 text-center">
            <h1 className="text-2xl font-bold tracking-normal text-slate-900">
              {title}
            </h1>
            {description && (
              <div className="mx-auto mt-3 max-w-88.75 text-left text-sm leading-5 text-slate-700">
                {description}
              </div>
            )}
          </div>

          {children}
        </section>
      </div>
    </main>
  );
}
