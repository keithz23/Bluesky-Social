"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
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

type ChangePasswordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ChangePasswordDialog({
  open,
  onOpenChange,
}: ChangePasswordDialogProps) {
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const {
    requestUpdatePasswordMutation,
    changePasswordMutation,
    isChangingPassword,
    isRequestingPasswordCode,
  } = useAccountSettings({
    onRequestPasswordCodeSuccess: () => {
      setCodeSent(true);
    },
    onSuccess: () => {
      resetForm();
      onOpenChange(false);
    },
  });

  const isBusy = isRequestingPasswordCode || isChangingPassword;

  const resetForm = () => {
    setOtp("");
    setNewPassword("");
    setNewPasswordConfirm("");
    setCodeSent(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const handleRequestCode = () => {
    requestUpdatePasswordMutation.mutate();
  };

  const handleChangePassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword !== newPasswordConfirm) {
      toast.error("Passwords do not match.");
      return;
    }

    changePasswordMutation.mutate({ otp, newPassword });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b border-gray-200 px-5 py-4 text-left">
          <DialogTitle className="text-lg font-bold text-slate-950">
            Change your password
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            If you want to change your password, we will send you a code to
            verify that this is your account.
          </DialogDescription>
        </DialogHeader>

        {codeSent ? (
          <form className="space-y-5 px-5 py-5" onSubmit={handleChangePassword}>
            <FieldGroup>
              <Field>
                <Label htmlFor="password-otp">Verification code</Label>
                <Input
                  id="password-otp"
                  name="otp"
                  inputMode="text"
                  autoComplete="one-time-code"
                  placeholder="Enter code"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  disabled={isChangingPassword}
                  className="text-[15px] py-6 bg-[#F1F5F9] border-transparent rounded-xl focus-visible:ring-0 focus-visible:bg-white focus-visible:border-[#1185fe] transition-all"
                  required
                />
              </Field>

              <Field>
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  disabled={isChangingPassword}
                  className="text-[15px] py-6 bg-[#F1F5F9] border-transparent rounded-xl focus-visible:ring-0 focus-visible:bg-white focus-visible:border-[#1185fe] transition-all"
                  required
                />
              </Field>

              <Field>
                <Label htmlFor="confirm-new-password">
                  Confirm new password
                </Label>
                <Input
                  id="confirm-new-password"
                  name="newPasswordConfirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  value={newPasswordConfirm}
                  onChange={(event) =>
                    setNewPasswordConfirm(event.target.value)
                  }
                  disabled={isChangingPassword}
                  className="text-[15px] py-6 bg-[#F1F5F9] border-transparent rounded-xl focus-visible:ring-0 focus-visible:bg-white focus-visible:border-[#1185fe] transition-all"
                  required
                />
              </Field>
            </FieldGroup>

            <p className="text-sm italic text-slate-500">
              Don&apos;t see an email?{" "}
              <button
                type="button"
                className="font-medium text-blue-600 not-italic hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isBusy}
                onClick={handleRequestCode}
              >
                {isRequestingPasswordCode
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
                disabled={
                  isChangingPassword ||
                  !otp.trim() ||
                  !newPassword ||
                  !newPasswordConfirm
                }
              >
                {isChangingPassword ? "Changing..." : "Verify and change"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-col justify-center gap-3 p-5">
            <Button
              type="button"
              disabled={isRequestingPasswordCode}
              onClick={handleRequestCode}
              className="h-11 rounded-full cursor-pointer"
            >
              {isRequestingPasswordCode ? "Sending..." : "Request code"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isRequestingPasswordCode}
              onClick={() => setCodeSent(true)}
              className="h-11 rounded-full border-transparent bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 cursor-pointer"
            >
              Already have a code?
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
