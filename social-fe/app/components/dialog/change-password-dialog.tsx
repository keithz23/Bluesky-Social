"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
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

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const changePasswordSchema = z
  .object({
    otp: z
      .string()
      .trim()
      .regex(
        /^[A-Za-z0-9]{5}-?[A-Za-z0-9]{5}$/,
        "Verification code should look like XXXXX-XXXXX.",
      ),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password cannot exceed 128 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain uppercase, lowercase, number and special character",
      ),
    newPasswordConfirm: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    message: "Passwords do not match.",
    path: ["newPasswordConfirm"],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordDialog({
  open,
  onOpenChange,
}: ChangePasswordDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onChange",
    defaultValues: {
      otp: "",
      newPassword: "",
      newPasswordConfirm: "",
    },
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    reset();
    setShowNewPassword(false);
    setShowConfirmPassword(false);
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

  const handleChangePassword = (data: ChangePasswordValues) => {
    changePasswordMutation.mutate({
      otp: data.otp.trim(),
      newPassword: data.newPassword,
    });
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
          <form
            className="space-y-5 px-5 py-5"
            onSubmit={handleSubmit(handleChangePassword)}
          >
            <FieldGroup>
              <Field>
                <Label htmlFor="password-otp">Verification code</Label>
                <Input
                  id="password-otp"
                  inputMode="text"
                  autoComplete="one-time-code"
                  placeholder="Enter code"
                  aria-invalid={Boolean(errors.otp)}
                  {...register("otp")}
                  disabled={isChangingPassword}
                  className={`text-[15px] py-6 bg-[#F1F5F9] border-transparent rounded-xl focus-visible:ring-0 focus-visible:bg-white focus-visible:border-[#1185fe] transition-all ${errors.otp ? "bg-red-50 ring-2 ring-red-500 focus-visible:ring-red-500/30" : ""}`}
                />
                {errors.otp && (
                  <p className="ml-1 text-xs font-medium text-red-500">
                    {errors.otp.message}
                  </p>
                )}
              </Field>

              <Field>
                <Label htmlFor="new-password">New password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Enter new password"
                    aria-invalid={Boolean(errors.newPassword)}
                    {...register("newPassword")}
                    disabled={isChangingPassword}
                    className={`text-[15px] py-6 pr-12 bg-[#F1F5F9] border-transparent rounded-xl focus-visible:ring-0 focus-visible:bg-white focus-visible:border-[#1185fe] transition-all ${errors.newPassword ? "bg-red-50 ring-2 ring-red-500 focus-visible:ring-red-500/30" : ""}`}
                  />
                  <button
                    tabIndex={1}
                    type="button"
                    aria-label={
                      showNewPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowNewPassword((current) => !current)}
                    disabled={isChangingPassword}
                    className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-slate-800 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {showNewPassword ? (
                      <EyeOff className="size-5" />
                    ) : (
                      <Eye className="size-5" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="ml-1 text-xs font-medium text-red-500">
                    {errors.newPassword.message}
                  </p>
                )}
              </Field>

              <Field>
                <Label htmlFor="confirm-new-password">
                  Confirm new password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-new-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                    aria-invalid={Boolean(errors.newPasswordConfirm)}
                    {...register("newPasswordConfirm")}
                    disabled={isChangingPassword}
                    className={`text-[15px] py-6 pr-12 bg-[#F1F5F9] border-transparent rounded-xl focus-visible:ring-0 focus-visible:bg-white focus-visible:border-[#1185fe] transition-all ${errors.newPasswordConfirm ? "bg-red-50 ring-2 ring-red-500 focus-visible:ring-red-500/30" : ""}`}
                  />
                  <button
                    tabIndex={1}
                    type="button"
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    disabled={isChangingPassword}
                    className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-slate-800 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-5" />
                    ) : (
                      <Eye className="size-5" />
                    )}
                  </button>
                </div>
                {errors.newPasswordConfirm && (
                  <p className="ml-1 text-xs font-medium text-red-500">
                    {errors.newPasswordConfirm.message}
                  </p>
                )}
              </Field>
            </FieldGroup>

            <p className="text-sm italic text-slate-500">
              Don&apos;t see an email?{" "}
              <button
                tabIndex={1}
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
                <Button
                  type="button"
                  variant="outline"
                  disabled={isBusy}
                  tabIndex={1}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={isChangingPassword || !isValid}
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
