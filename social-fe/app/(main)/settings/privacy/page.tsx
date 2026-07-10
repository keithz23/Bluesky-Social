"use client";

import type { ComponentType } from "react";
import { ChevronRight, KeyRound, ShieldCheck } from "lucide-react";
import { useAuth } from "@/app/hooks/use-auth";
import { useState } from "react";
import Enable2FADialog from "@/app/components/dialog/enable-2fa-dialog";
import Disable2FADialog from "@/app/components/dialog/disable-2fa-dialog";

type PrivacyRowProps = {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  description?: string;
  actionLabel?: string;
  chevron?: boolean;
  iconClassName?: string;
  labelClassName?: string;
  onClick?: () => void;
};

export default function PrivacyPage() {
  const { user } = useAuth();
  const [isEnable2FAOpen, setIsEnable2FAOpen] = useState(false);
  const [isDisable2FAOpen, setIsDisable2FAOpen] = useState(false);
  const hasPassword = Boolean(user?.hasPassword);
  const twoFactorEnabled = Boolean(user?.twoFactorEnabled);

  return (
    <div className="flex w-full flex-col bg-white">
      <section className="border-b border-gray-200 py-3">
        {hasPassword && (
          <PrivacyRow
            icon={ShieldCheck}
            label="Two-factor authentication (2FA)"
            description={twoFactorEnabled ? "Enable" : undefined}
            actionLabel={twoFactorEnabled ? "Disable" : "Enable"}
            iconClassName={twoFactorEnabled ? "text-blue-600" : "text-black"}
            labelClassName={twoFactorEnabled ? 'text-red-600' : 'text-blue-600'}
            onClick={
              twoFactorEnabled ? () => setIsDisable2FAOpen(true) : () => setIsEnable2FAOpen(true)
            }
          />
        )}
        <PrivacyRow
          icon={KeyRound}
          label="App passwords"
          chevron
        />
      </section>

      {hasPassword && (
        <Enable2FADialog
          open={isEnable2FAOpen}
          onOpenChange={setIsEnable2FAOpen}
          email={user?.email}
        />
      )}
      {isDisable2FAOpen && (
        <Disable2FADialog
          open={isDisable2FAOpen}
          onOpenChange={setIsDisable2FAOpen}
          email={user?.email}
        />
      )}
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
  labelClassName = "",
  onClick,
}: PrivacyRowProps) {
  return (
    <button
      type="button"
      disabled={!onClick}
      onClick={onClick}
      className={`flex h-12 w-full items-center justify-between gap-4 px-5 text-left transition ${onClick ? "cursor-pointer hover:bg-gray-50" : "cursor-default"
        }`}
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
          <span className={`text-[16px] font-normal ${labelClassName}`}>
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
