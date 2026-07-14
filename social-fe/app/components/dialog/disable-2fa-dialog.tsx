"use client";

import { ShieldOff } from "lucide-react";
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

interface Disable2FADialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email?: string;
}

const disable2FASchema = z.object({
  password: z.string().min(1, "Password is required."),
  otp: z.string().trim().min(1, "Authentication code is required."),
});

type Disable2FAValues = z.infer<typeof disable2FASchema>;

export default function Disable2FADialog({
  open,
  onOpenChange,
}: Disable2FADialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<Disable2FAValues>({
    resolver: zodResolver(disable2FASchema),
    mode: "onChange",
    defaultValues: {
      password: "",
      otp: "",
    },
  });

  const { disable2FAMutation, isDisabling2FA } = useAccountSettings({
    onSuccess: () => {
      resetForm();
      onOpenChange(false);
    },
  });

  const resetForm = () => {
    reset();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isDisabling2FA) return;

    if (!nextOpen) {
      resetForm();
    }

    onOpenChange(nextOpen);
  };

  const handleDisable2FA = (data: Disable2FAValues) => {
    disable2FAMutation.mutate({
      password: data.password,
      otp: data.otp.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b border-gray-200 px-5 py-4 text-left">
          <DialogTitle className="text-lg font-bold text-slate-950">
            Disable two-factor authentication
          </DialogTitle>

          <DialogDescription className="text-sm text-slate-500">
            Confirm your password and enter an authenticator or recovery code.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5 px-5 py-5"
          onSubmit={handleSubmit(handleDisable2FA)}
        >
          <div className="flex gap-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-3 text-sm text-slate-700">
            <ShieldOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

            <div className="space-y-1">
              <p className="font-medium text-slate-900">
                Your account will be less secure.
              </p>
              <p>
                App passwords and recovery codes will be revoked when two-factor
                authentication is disabled.
              </p>
            </div>
          </div>

          <FieldGroup>
            <Field>
              <Label htmlFor="disable-2fa-password">Current password</Label>
              <Input
                id="disable-2fa-password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                aria-invalid={Boolean(errors.password)}
                {...register("password")}
                disabled={isDisabling2FA}
                className={`rounded-xl border bg-[#F1F5F9] py-6 text-[15px] transition-all focus-visible:bg-white focus-visible:ring-0 ${
                  errors.password
                    ? "border-red-500 focus-visible:border-red-500"
                    : "border-transparent focus-visible:border-[#1185fe]"
                }`}
              />
              {errors.password && (
                <p className="ml-1 text-xs font-medium text-red-500">
                  {errors.password.message}
                </p>
              )}
            </Field>

            <Field>
              <Label htmlFor="disable-2fa-otp">
                Authenticator or recovery code
              </Label>
              <Input
                id="disable-2fa-otp"
                inputMode="text"
                autoComplete="one-time-code"
                placeholder="000000 or KNT-XXXX-XXXX-XXXX"
                aria-invalid={Boolean(errors.otp)}
                {...register("otp")}
                disabled={isDisabling2FA}
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

          <DialogFooter className="gap-2 sm:justify-between">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isDisabling2FA}
                className="cursor-pointer"
              >
                Cancel
              </Button>
            </DialogClose>

            <Button
              type="submit"
              variant="destructive"
              disabled={isDisabling2FA || !isValid}
              className="cursor-pointer"
            >
              {isDisabling2FA ? "Disabling..." : "Verify and disable"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
