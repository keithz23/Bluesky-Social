"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { AuthService } from "@/app/services/auth.service";
import { useAuthStore } from "@/app/store/use-auth.store";
import { extractErrMsg } from "@/app/utils/error.util";
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

type UpdateEmailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail?: string;
};

export default function UpdateEmailDialog({
  open,
  onOpenChange,
  currentEmail,
}: UpdateEmailDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  const requestUpdateEmailMutation = useMutation({
    mutationFn: () => AuthService.requestUpdateEmail({ newEmail }),
    onSuccess: () => {
      setCodeSent(true);
      toast.success("Verification code sent.");
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  const updateEmailMutation = useMutation({
    mutationFn: () => AuthService.updateEmail({ otp }),
    onSuccess: async () => {
      clearAuth();
      queryClient.setQueryData(["me"], null);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      onOpenChange(false);
      toast.success("Email updated. Please login again.");
      router.push("/login");
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  const isRequestingCode = requestUpdateEmailMutation.isPending;
  const isUpdatingEmail = updateEmailMutation.isPending;

  const handleRequestCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    requestUpdateEmailMutation.mutate();
  };

  const handleUpdateEmail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateEmailMutation.mutate();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setNewEmail("");
      setOtp("");
      setCodeSent(false);
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
          onSubmit={codeSent ? handleUpdateEmail : handleRequestCode}
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
                name="newEmail"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                disabled={codeSent || isRequestingCode || isUpdatingEmail}
                className="text-[15px] py-6 bg-[#F1F5F9] border-transparent rounded-xl focus-visible:ring-0 focus-visible:bg-white focus-visible:border-[#1185fe] transition-all"
                required
              />
            </Field>

            {codeSent && (
              <Field>
                <Label htmlFor="email-otp">Verification code</Label>
                <Input
                  id="email-otp"
                  name="otp"
                  inputMode="text"
                  autoComplete="one-time-code"
                  placeholder="Enter code"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  disabled={isUpdatingEmail}
                  className="text-[15px] py-6 bg-[#F1F5F9] border-transparent rounded-xl focus-visible:ring-0 focus-visible:bg-white focus-visible:border-[#1185fe] transition-all"
                  required
                />
              </Field>
            )}
          </FieldGroup>

          {codeSent && (
            <p className="text-sm italic text-slate-500">
              Don&apos;t see an email?{" "}
              <button
                type="button"
                className="font-medium text-blue-600 not-italic hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isRequestingCode || isUpdatingEmail}
                onClick={() => requestUpdateEmailMutation.mutate()}
              >
                {isRequestingCode ? "Resending..." : "Click here to resend."}
              </button>
            </p>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isRequestingCode || isUpdatingEmail}
              >
                Cancel
              </Button>
            </DialogClose>
            {codeSent ? (
              <Button type="submit" disabled={isUpdatingEmail || !otp.trim()}>
                {isUpdatingEmail ? "Updating..." : "Verify and update"}
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isRequestingCode || !newEmail.trim()}
              >
                {isRequestingCode ? "Sending..." : "Send code"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
