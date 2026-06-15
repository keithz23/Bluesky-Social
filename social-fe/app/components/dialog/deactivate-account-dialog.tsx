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

type DeactivateAccountDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function DeactivateAccountDialog({
    open,
    onOpenChange,
}: DeactivateAccountDialogProps) {
    const [otp, setOtp] = useState("");
    const [codeSent, setCodeSent] = useState(false);
    const {
        requestDeactivateAccountMutation,
        deactivateAccountMutation,
        isRequestingDeactivateCode,
        isDeactivatingAccount,
    } = useAccountSettings({
        onRequestDeactivateCodeSuccess: () => {
            setCodeSent(true);
        },
        onSuccess: () => {
            resetForm();
            onOpenChange(false);
        },
    });

    const isBusy = isRequestingDeactivateCode || isDeactivatingAccount;

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
        requestDeactivateAccountMutation.mutate();
    };

    const handleDeactivateAccount = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        deactivateAccountMutation.mutate({ otp });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
                <DialogHeader className="border-b border-gray-200 px-5 py-4 text-left">
                    <DialogTitle className="text-lg font-bold text-slate-950">
                        Deactivate account
                    </DialogTitle>
                    <DialogDescription className="text-sm text-slate-500">
                        Your account will be signed out on every device after verification.
                    </DialogDescription>
                </DialogHeader>

                {codeSent ? (
                    <form
                        className="space-y-5 px-5 py-5"
                        onSubmit={handleDeactivateAccount}
                    >
                        <FieldGroup>
                            <Field>
                                <Label htmlFor="deactivate-otp">Verification code</Label>
                                <Input
                                    id="deactivate-otp"
                                    name="otp"
                                    inputMode="text"
                                    autoComplete="one-time-code"
                                    placeholder="Enter code"
                                    value={otp}
                                    onChange={(event) => setOtp(event.target.value)}
                                    disabled={isDeactivatingAccount}
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
                                {isRequestingDeactivateCode
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
                                disabled={isDeactivatingAccount || !otp.trim()}
                                className="cursor-pointer"
                            >
                                {isDeactivatingAccount ? "Deactivating..." : "Deactivate"}
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="space-y-5 px-5 py-5">
                        <div className="flex gap-3 rounded-lg border border-red-100 bg-red-50 px-3 py-3 text-sm text-red-700">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <div className="space-y-1">
                                <p className="font-medium">
                                    This will deactivate your account.
                                </p>
                                <p>
                                    Your profile and activity will stop being available while the
                                    account is deactivated.
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
                                disabled={isRequestingDeactivateCode}
                                onClick={handleRequestCode}
                                className="cursor-pointer"
                            >
                                {isRequestingDeactivateCode ? "Sending..." : "Continue"}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
