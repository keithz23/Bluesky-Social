"use client";

import type { ComponentType, ReactNode } from "react";
import {
  EyeOff,
  LockKeyhole,
  UserCheck,
  UnlockKeyhole,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAccountSettings } from "@/app/hooks/use-account-settings";
import { useAuth } from "@/app/hooks/use-auth";

export default function AccountPrivacyPage() {
  const [showPrivateConfirm, setShowPrivateConfirm] = useState(false);
  const { user, isLoadingProfile } = useAuth();
  const { updateAccountPrivacyMutation, isUpdatingAccountPrivacy } =
    useAccountSettings();
  const isPrivate = Boolean(user?.isPrivate);
  const isDisabled = isLoadingProfile || isUpdatingAccountPrivacy || !user;
  const Icon = isPrivate ? LockKeyhole : UnlockKeyhole;

  const togglePrivacy = () => {
    if (isDisabled) return;

    if (!isPrivate) {
      setShowPrivateConfirm(true);
      return;
    }

    updateAccountPrivacyMutation.mutate({ isPrivate: false });
  };

  const switchToPrivate = () => {
    if (isDisabled) return;
    setShowPrivateConfirm(false);
    updateAccountPrivacyMutation.mutate({ isPrivate: true });
  };

  return (
    <div className="flex w-full flex-col bg-white">
      <section className="border-b border-gray-200 py-3">
        <button
          type="button"
          role="switch"
          aria-checked={isPrivate}
          disabled={isDisabled}
          onClick={togglePrivacy}
          className="flex min-h-16 w-full items-center justify-between gap-4 px-5 text-left transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <div className="flex min-w-0 items-start gap-4">
            <Icon
              className={`mt-0.5 h-5 w-5 shrink-0 ${
                isPrivate ? "text-blue-600" : "text-black"
              }`}
              strokeWidth={2.2}
            />
            <div className="min-w-0">
              <span className="block text-[16px] font-normal leading-5 text-black">
                Private account
              </span>
              <span className="mt-1 block text-[14px] font-normal leading-5 text-slate-600">
                When enabled, only people you approve can follow you and see
                protected activity.
              </span>
            </div>
          </div>

          <span
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${
              isPrivate ? "bg-blue-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                isPrivate ? "left-6" : "left-1"
              }`}
            />
          </span>
        </button>
      </section>

      <Dialog
        open={showPrivateConfirm}
        onOpenChange={(open) => {
          if (!isUpdatingAccountPrivacy) setShowPrivateConfirm(open);
        }}
      >
        <DialogContent
          className="gap-0 overflow-hidden p-0 sm:max-w-md"
        >
          <DialogHeader className="border-b border-gray-200 px-5 py-4 text-left">
            <DialogTitle className="text-lg font-bold text-slate-950">
              Make your account private?
            </DialogTitle>

            <DialogDescription className="text-sm leading-5 text-slate-500">
              New followers will need your approval before they can see your
              protected activity.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-5 py-5">
            <div className="flex gap-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-3 text-sm text-slate-700">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

              <div className="space-y-1">
                <p className="font-medium text-slate-900">
                  Your current followers stay connected.
                </p>
                <p>
                  Future follow requests will wait for you to accept or decline
                  them.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <PrivateConfirmItem icon={UserCheck}>
                You approve who can follow you.
              </PrivateConfirmItem>
              <PrivateConfirmItem icon={EyeOff}>
                People who do not follow you will see a limited profile.
              </PrivateConfirmItem>
              <PrivateConfirmItem icon={UsersRound}>
                You can switch back to public anytime from this setting.
              </PrivateConfirmItem>
            </div>
          </div>

          <DialogFooter className="border-t border-gray-200 px-5 py-4 sm:justify-between">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isUpdatingAccountPrivacy}
                className="cursor-pointer"
              >
                Cancel
              </Button>
            </DialogClose>

            <Button
              type="button"
              disabled={isUpdatingAccountPrivacy}
              onClick={switchToPrivate}
              className="cursor-pointer"
            >
              {isUpdatingAccountPrivacy ? "Updating..." : "Switch to private"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PrivateConfirmItem({
  icon: Icon,
  children,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" strokeWidth={2} />
      <p className="min-w-0 text-sm leading-5 text-slate-700">{children}</p>
    </div>
  );
}
