"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
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
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

type Enable2FADialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email?: string;
};

const enable2FASchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z0-9]{5}-?[A-Za-z0-9]{5}$/,
      "Verification code should look like XXXXX-XXXXX.",
    ),
});

type Enable2FAValues = z.infer<typeof enable2FASchema>;

export default function Enable2FADialog({
  open,
  onOpenChange,
  email,
}: Enable2FADialogProps) {
  const [codeSent, setCodeSent] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<Enable2FAValues>({
    resolver: zodResolver(enable2FASchema),
    mode: "onChange",
    defaultValues: {
      otp: "",
    },
  });

  const {
    requestEnable2FAMutation,
    enable2FAMutation,
    isRequestingEnable2FA,
    isEnable2FA,
  } = useAccountSettings({
    onRequestEnable2FACodeSuccess: () => {
      setCodeSent(true);
    },
    onSuccess: () => {
      resetForm();
      onOpenChange(false);
    },
  });

  const isBusy = isRequestingEnable2FA || isEnable2FA;

  const resetForm = () => {
    reset();
    setCodeSent(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isBusy) return;
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  const handleRequestCode = () => {
    requestEnable2FAMutation.mutate();
  };

  const handleEnable2FA = (data: Enable2FAValues) => {
    enable2FAMutation.mutate({ otp: data.otp.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b border-gray-200 px-5 py-4 text-left">
          <DialogTitle className="text-lg font-bold text-slate-950">
            Enable two-factor authentication
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            We will send a sign-in code to your account email before turning on
            two-factor authentication.
          </DialogDescription>
        </DialogHeader>

        {codeSent ? (
          <form
            className="space-y-5 px-5 py-5"
            onSubmit={handleSubmit(handleEnable2FA)}
          >
            {email && (
              <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
                <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">
                    Code sent to
                  </p>
                  <p className="truncate text-sm font-medium text-slate-900">
                    {email}
                  </p>
                </div>
              </div>
            )}

            <FieldGroup>
              <Field>
                <Label htmlFor="enable-2fa-otp">Verification code</Label>
                <Input
                  id="enable-2fa-otp"
                  inputMode="text"
                  autoComplete="one-time-code"
                  placeholder="Enter code"
                  aria-invalid={Boolean(errors.otp)}
                  {...register("otp")}
                  disabled={isEnable2FA}
                  className={`rounded-xl border bg-[#F1F5F9] py-6 text-[15px] transition-all focus-visible:bg-white focus-visible:ring-0 ${
                    errors.otp
                      ? "border-red-500 focus-visible:border-red-500"
                      : "border-transparent focus-visible:border-[#1185fe]"
                  }`}
                />
                {errors.otp && (
                  <p className="ml-1 text-xs font-medium text-red-500">
                    {errors.otp.message}
                  </p>
                )}
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
                {isRequestingEnable2FA
                  ? "Resending..."
                  : "Click here to resend."}
              </button>
            </p>

            <DialogFooter className="gap-2 sm:justify-between">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isBusy}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isEnable2FA || !isValid}
                className="cursor-pointer"
              >
                {isEnable2FA ? "Enabling..." : "Verify and enable"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-5 px-5 py-5">
            <div className="flex gap-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-3 text-sm text-slate-700">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <div className="space-y-1">
                <p className="font-medium text-slate-900">
                  Protect your account with an email code.
                </p>
                <p>
                  After this is enabled, password sign-ins will require a
                  verification code from your email.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:justify-between">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isBusy}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="button"
                disabled={isRequestingEnable2FA}
                onClick={handleRequestCode}
                className="cursor-pointer"
              >
                {isRequestingEnable2FA ? "Sending..." : "Send code"}
              </Button>
            </DialogFooter>

            <button
              type="button"
              disabled={isBusy}
              onClick={() => setCodeSent(true)}
              className="w-full text-center text-sm font-medium text-blue-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            >
              Already have a code?
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
