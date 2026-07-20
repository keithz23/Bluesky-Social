"use client";

import { FormEvent, useState } from "react";
import { AlertTriangle } from "lucide-react";
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
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccountSettings } from "@/app/hooks/use-account-settings";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DeleteAccountDialog({
  open,
  onOpenChange,
}: DeleteAccountDialogProps) {
  const [otp, setOtp] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const {
    requestDeleteAccountMutation,
    deleteAccountMutation,
    isRequestingDeleteCode,
    isDeletingAccount,
  } = useAccountSettings({
    onRequestDeleteCodeSuccess: () => {
      setCodeSent(true);
    },
    onSuccess: () => {
      resetForm();
      onOpenChange(false);
    },
  });

  const isBusy = isRequestingDeleteCode || isDeletingAccount;

  const resetForm = () => {
    setOtp("");
    setCodeSent(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isBusy) return;
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  const handleRequestCode = () => {
    requestDeleteAccountMutation.mutate();
  };

  const handleDeleteAccount = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    deleteAccountMutation.mutate({ otp });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b border-gray-200 px-5 py-4 text-left">
          <DialogTitle className="text-lg font-bold text-slate-950">
            Delete account
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Your account will be signed out on every device after verification.
          </DialogDescription>
        </DialogHeader>

        {codeSent ? (
          <form className="space-y-5 px-5 py-5" onSubmit={handleDeleteAccount}>
            <FieldGroup>
              <Field>
                <Label htmlFor="delete-otp">Verification code</Label>
                <Input
                  id="delete-otp"
                  name="otp"
                  inputMode="text"
                  autoComplete="one-time-code"
                  placeholder="Enter code"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  disabled={isDeletingAccount}
                  className="rounded-xl border-transparent bg-[#F1F5F9] py-6 text-[15px] transition-all focus-visible:border-[#1185fe] focus-visible:bg-white focus-visible:ring-0"
                  required
                />
              </Field>
            </FieldGroup>

            <p className="text-sm italic text-slate-500">
              Don&apos;t see an email?{" "}
              <button
                type="button"
                className="font-medium not-italic text-blue-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isBusy}
                onClick={handleRequestCode}
              >
                {isRequestingDeleteCode
                  ? "Resending..."
                  : "Click here to resend."}
              </button>
            </p>

            <DialogFooter className="gap-2 sm:justify-between">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isBusy}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                variant="destructive"
                disabled={isDeletingAccount || !otp.trim()}
                className="cursor-pointer"
              >
                {isDeletingAccount ? "Deleting..." : "Delete account"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-5 px-5 py-5">
            <div className="flex gap-3 rounded-lg border border-red-100 bg-red-50 px-3 py-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="space-y-1">
                <p className="font-medium">This will delete your account.</p>
                <p>
                  Your profile and account access will stop being available
                  after verification.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:justify-between">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isBusy}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="button"
                variant="destructive"
                disabled={isRequestingDeleteCode}
                onClick={handleRequestCode}
                className="cursor-pointer"
              >
                {isRequestingDeleteCode ? "Sending..." : "Continue"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
