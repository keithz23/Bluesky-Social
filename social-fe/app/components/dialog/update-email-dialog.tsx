"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
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
import { type SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

type UpdateEmailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail?: string;
};

const updateEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address"),
  otp: z.string().trim(),
});

type UpdateEmailValues = z.infer<typeof updateEmailSchema>;

export default function UpdateEmailDialog({
  open,
  onOpenChange,
  currentEmail,
}: UpdateEmailDialogProps) {
  const [codeSent, setCodeSent] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    setError,
    formState: { errors, isValid },
  } = useForm<UpdateEmailValues>({
    resolver: zodResolver(updateEmailSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      otp: "",
    },
  });

  const resetForm = () => {
    reset();
    setCodeSent(false);
  };

  const {
    requestUpdateEmailMutation,
    updateEmailMutation,
    isUpdatingEmail,
    isRequestingEmailCode,
  } = useAccountSettings({
    onRequestEmailCodeSuccess: () => {
      setCodeSent(true);
    },
    onSuccess: () => {
      resetForm();
      onOpenChange(false);
    },
  });

  const handleRequestCode: SubmitHandler<UpdateEmailValues> = (data) => {
    requestUpdateEmailMutation.mutate({ newEmail: data.email });
  };

  const handleUpdateEmail: SubmitHandler<UpdateEmailValues> = (data) => {
    if (!data.otp) {
      setError("otp", {
        type: "manual",
        message: "Verification code is required",
      });
      return;
    }

    updateEmailMutation.mutate({ otp: data.otp });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b border-gray-200 px-5 py-4 text-left">
          <DialogTitle className="text-lg font-bold text-slate-950">
            Update email
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            We will send a verification code before changing your account email.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5 px-5 py-5"
          onSubmit={handleSubmit(
            codeSent ? handleUpdateEmail : handleRequestCode,
          )}
        >
          {currentEmail && (
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
              <Mail className="h-4 w-4 shrink-0 text-slate-500" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">
                  Current email
                </p>
                <p className="truncate text-sm font-medium text-slate-900">
                  {currentEmail}
                </p>
              </div>
            </div>
          )}

          <FieldGroup>
            <Field>
              <Label htmlFor="new-email">New email</Label>
              <Input
                id="new-email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
                disabled={codeSent || isRequestingEmailCode || isUpdatingEmail}
                className={`rounded-xl border bg-[#F1F5F9] py-6 text-[15px] transition-all focus-visible:bg-white focus-visible:ring-0 ${errors.email
                    ? "border-red-500 focus-visible:border-red-500"
                    : "border-transparent focus-visible:border-[#1185fe]"
                  }`}
              />
              {errors.email && (
                <p className="ml-1 text-xs font-medium text-red-500">
                  {errors.email.message}
                </p>
              )}
            </Field>

            {codeSent && (
              <Field>
                <Label htmlFor="email-otp">Verification code</Label>
                <Input
                  id="email-otp"
                  inputMode="text"
                  autoComplete="one-time-code"
                  placeholder="Enter code"
                  aria-invalid={Boolean(errors.otp)}
                  {...register("otp")}
                  disabled={isUpdatingEmail}
                  className={`rounded-xl border bg-[#F1F5F9] py-6 text-[15px] transition-all focus-visible:bg-white focus-visible:ring-0 ${errors.otp
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
            )}
          </FieldGroup>

          {codeSent && (
            <p className="text-sm italic text-slate-500">
              Don&apos;t see an email?{" "}
              <button
                type="button"
                className="font-medium text-blue-600 not-italic hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isRequestingEmailCode || isUpdatingEmail}
                onClick={() =>
                  requestUpdateEmailMutation.mutate({
                    newEmail: getValues("email").trim(),
                  })
                }
              >
                {isRequestingEmailCode
                  ? "Resending..."
                  : "Click here to resend."}
              </button>
            </p>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            <DialogClose asChild>
              <Button
                tabIndex={1}
                type="button"
                variant="outline"
                className="cursor-pointer"
                disabled={isRequestingEmailCode || isUpdatingEmail}
              >
                Cancel
              </Button>
            </DialogClose>
            {codeSent ? (
              <Button type="submit" disabled={isUpdatingEmail} className="cursor-pointer">
                {isUpdatingEmail ? "Updating..." : "Verify and update"}
              </Button>
            ) : (
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={isRequestingEmailCode || !isValid}
              >
                {isRequestingEmailCode ? "Sending..." : "Send code"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
