"use client";

import type { ComponentType } from "react";
import { useState } from "react";
import {
  AtSign,
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
import UpdateEmailDialog from "@/app/components/dialog/update-email-dialog";
import { useAuth } from "@/app/hooks/use-auth";
import ChangePasswordDialog from "@/app/components/dialog/change-password-dialog";
import ChangeUsernameDialog from "@/app/components/dialog/change-username-dialog";
import ChangeBirthdayDialog from "@/app/components/dialog/change-birthday-dialog";
import DeactivateAccountDialog from "@/app/components/dialog/deactivate-account-dialog";

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
  const [isUpdateEmailOpen, setIsUpdateEmailOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isChangeUsernameOpen, setIsChangeUsernameOpen] = useState(false);
  const [isChangeBirthdayOpen, setIsChangeBirthdayOpen] = useState(false);
  const [isDeactivateAccountOpen, setIsDeactivateAccountOpen] = useState(false);
  const email = user?.email || "No email";
  const handle = user?.username ? `@${user.username}` : "Not set";
  const hasPassword = Boolean(user?.hasPassword);

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
          onClick={() => setIsUpdateEmailOpen(true)}
        />
      </section>

      <section className="border-b border-gray-200 py-3">
        {hasPassword && (
          <AccountRow
            icon={Lock}
            label="Password"
            chevron
            onClick={() => setIsChangePasswordOpen(true)}
          />
        )}
        <AccountRow
          icon={AtSign}
          label="Handle"
          value={handle}
          valueClassName="text-slate-500"
          chevron
          onClick={() => setIsChangeUsernameOpen(true)}
        />
        <AccountRow
          icon={Cake}
          label="Birthday"
          value="Edit"
          valueClassName="text-blue-600"
          onClick={() => setIsChangeBirthdayOpen(true)}
        />
      </section>

      <section className="py-3">
        <AccountRow
          icon={Snowflake}
          label="Deactivate account"
          danger
          chevron
          onClick={() => setIsDeactivateAccountOpen(true)}
        />
        <AccountRow
          icon={Trash2}
          label="Delete account"
          danger
          chevron
          onClick={() => unavailable("Delete account")}
        />
      </section>

      <UpdateEmailDialog
        open={isUpdateEmailOpen}
        onOpenChange={setIsUpdateEmailOpen}
        currentEmail={user?.email}
      />

      {hasPassword && (
        <ChangePasswordDialog
          open={isChangePasswordOpen}
          onOpenChange={setIsChangePasswordOpen}
        />
      )}

      <ChangeUsernameDialog
        open={isChangeUsernameOpen}
        onOpenChange={setIsChangeUsernameOpen}
      />

      <ChangeBirthdayDialog
        open={isChangeBirthdayOpen}
        onOpenChange={setIsChangeBirthdayOpen}
        dateOfBirth={user?.dateOfBirth}
      />

      <DeactivateAccountDialog
        open={isDeactivateAccountOpen}
        onOpenChange={setIsDeactivateAccountOpen}
      />
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
            className={`truncate text-[15px] font-normal ${valueClassName || (danger ? "text-[#F4214B]" : "text-slate-500")
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
            className={`h-5 w-5 shrink-0 ${danger ? "text-[#F4214B]" : "text-slate-500"
              }`}
            strokeWidth={1.8}
          />
        )}
      </div>
    </button>
  );
}
