"use client";

import type { ComponentType } from "react";
import {
  AtSign,
  Bot,
  BriefcaseBusiness,
  Cake,
  ChevronRight,
  Lock,
  Mail,
  Pencil,
  ShieldCheck,
  Snowflake,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/hooks/use-auth";

type AccountRowProps = {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value?: string;
  valueClassName?: string;
  danger?: boolean;
  chevron?: boolean;
  verified?: boolean;
  onClick?: () => void;
};

const unavailable = (label: string) => {
  toast.info(`${label} is not available yet`);
};

export default function AccountPage() {
  const { user } = useAuth();
  const email = user?.email || "No email";
  const handle = user?.username ? `@${user.username}` : "Not set";

  return (
    <div className="flex w-full flex-col bg-white">
      <section className="border-b border-gray-200 py-3">
        <AccountRow
          icon={Mail}
          label="Email"
          value={email}
          valueClassName="text-slate-500"
          verified
        />
        <AccountRow
          icon={Pencil}
          label="Update email"
          chevron
          onClick={() => unavailable("Update email")}
        />
      </section>

      <section className="border-b border-gray-200 py-3">
        <AccountRow
          icon={Lock}
          label="Password"
          chevron
          onClick={() => unavailable("Password settings")}
        />
        <AccountRow
          icon={AtSign}
          label="Handle"
          value={handle}
          valueClassName="text-slate-500"
          chevron
          onClick={() => unavailable("Handle settings")}
        />
        <AccountRow
          icon={Cake}
          label="Birthday"
          value="Edit"
          valueClassName="text-blue-600"
          onClick={() => unavailable("Birthday settings")}
        />
        <AccountRow
          icon={Bot}
          label="Automation label"
          value="Off"
          valueClassName="text-slate-500"
          chevron
          onClick={() => unavailable("Automation label")}
        />
      </section>

      <section className="py-3">
        <AccountRow
          icon={BriefcaseBusiness}
          label="Export my data"
          chevron
          onClick={() => unavailable("Export my data")}
        />
        <AccountRow
          icon={Snowflake}
          label="Deactivate account"
          danger
          chevron
          onClick={() => unavailable("Deactivate account")}
        />
        <AccountRow
          icon={Trash2}
          label="Delete account"
          danger
          chevron
          onClick={() => unavailable("Delete account")}
        />
      </section>
    </div>
  );
}

function AccountRow({
  icon: Icon,
  label,
  value,
  valueClassName,
  danger,
  chevron,
  verified,
  onClick,
}: AccountRowProps) {
  const colorClass = danger ? "text-[#F4214B]" : "text-black";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-full cursor-pointer items-center justify-between gap-4 px-5 text-left transition hover:bg-gray-50"
    >
      <div className="flex min-w-0 items-center gap-4">
        <Icon className={`h-5 w-5 shrink-0 ${colorClass}`} strokeWidth={2.2} />
        <span className={`truncate text-[16px] font-normal ${colorClass}`}>
          {label}
        </span>
      </div>

      <div className="flex min-w-0 shrink items-center gap-2">
        {value && (
          <span
            className={`truncate text-[15px] font-normal ${
              valueClassName || (danger ? "text-[#F4214B]" : "text-slate-500")
            }`}
          >
            {value}
          </span>
        )}
        {verified && (
          <ShieldCheck
            className="h-4.5 w-4.5 shrink-0 text-blue-600"
            strokeWidth={2.2}
          />
        )}
        {chevron && (
          <ChevronRight
            className={`h-5 w-5 shrink-0 ${
              danger ? "text-[#F4214B]" : "text-slate-500"
            }`}
            strokeWidth={1.8}
          />
        )}
      </div>
    </button>
  );
}
