"use client";

import type { ComponentType } from "react";
import { ChevronRight, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

type PrivacyRowProps = {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  description?: string;
  actionLabel?: string;
  chevron?: boolean;
  iconClassName?: string;
  onClick?: () => void;
};

const unavailable = (label: string) => {
  toast.info(`${label} is not available yet`);
};

export default function PrivacyPage() {
  return (
    <div className="flex w-full flex-col bg-white">
      <section className="border-b border-gray-200 py-3">
        <PrivacyRow
          icon={ShieldCheck}
          label="Two-factor authentication (2FA)"
          actionLabel="Enable"
          onClick={() => unavailable("Two-factor authentication")}
        />
        <PrivacyRow
          icon={KeyRound}
          label="App passwords"
          chevron
          onClick={() => unavailable("App passwords")}
        />
      </section>
    </div>
  );
}

function PrivacyRow({
  icon: Icon,
  label,
  description,
  actionLabel,
  chevron,
  iconClassName = "text-black",
  onClick,
}: PrivacyRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-full cursor-pointer items-center justify-between gap-4 px-5 text-left transition hover:bg-gray-50"
    >
      <div className="flex min-w-0 items-start gap-4">
        <Icon className={`h-5 w-5 shrink-0 ${iconClassName}`} strokeWidth={2.2} />
        <div className="min-w-0">
          <span className="block truncate text-[16px] font-normal leading-5 text-black">
            {label}
          </span>
          {description && (
            <span className="block truncate text-[14px] font-normal leading-4 text-slate-600">
              {description}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center">
        {actionLabel && (
          <span className="text-[16px] font-normal text-blue-600">
            {actionLabel}
          </span>
        )}
        {chevron && (
          <ChevronRight
            className="h-5 w-5 shrink-0 text-slate-500"
            strokeWidth={1.8}
          />
        )}
      </div>
    </button>
  );
}
