"use client";

import { useState } from "react";
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

type Disable2FADialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    email?: string;
};

const disable2FASchema = z.object({
    otp: z
        .string()
        .trim()
        .regex(
            /^[A-Za-z0-9]{5}-?[A-Za-z0-9]{5}$/,
            "Verification code should look like XXXXX-XXXXX.",
        ),
});

type Disable2FAValues = z.infer<typeof disable2FASchema>;

export default function Disable2FADialog({
    open,
    onOpenChange,
    email,
}: Disable2FADialogProps) {
    const [codeSent, setCodeSent] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isValid },
    } = useForm<Disable2FAValues>({
        resolver: zodResolver(disable2FASchema),
        mode: "onChange",
        defaultValues: {
            otp: "",
        },
    });

    const {
        requestDisable2FAMutation,
        disable2FAMutation,
        isRequestingDisable2FA,
        isDisabling2FA,
    } = useAccountSettings({
        onRequestDisable2FACodeSuccess: () => {
            setCodeSent(true);
        },
        onSuccess: () => {
            resetForm();
            onOpenChange(false);
        },
    });

    const isBusy = isRequestingDisable2FA || isDisabling2FA;

    const resetForm = () => {
        reset();
        setCodeSent(false);
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (isBusy) return;

        if (!nextOpen) {
            resetForm();
        }

        onOpenChange(nextOpen);
    };

    const handleRequestCode = () => {
        requestDisable2FAMutation.mutate();
    };

    const handleDisable2FA = (data: Disable2FAValues) => {
        disable2FAMutation.mutate({
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
                        We will send a verification code to your account email before
                        turning off two-factor authentication.
                    </DialogDescription>
                </DialogHeader>

                {codeSent ? (
                    <form
                        className="space-y-5 px-5 py-5"
                        onSubmit={handleSubmit(handleDisable2FA)}
                    >
                        {email && (
                            <div className="flex items-center gap-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5">
                                <ShieldOff className="h-4 w-4 shrink-0 text-amber-600" />

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
                                <Label htmlFor="disable-2fa-otp">
                                    Verification code
                                </Label>

                                <Input
                                    id="disable-2fa-otp"
                                    inputMode="text"
                                    autoComplete="one-time-code"
                                    placeholder="Enter code"
                                    aria-invalid={Boolean(errors.otp)}
                                    {...register("otp")}
                                    disabled={isDisabling2FA}
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
                        </FieldGroup>

                        <p className="text-sm italic text-slate-500">
                            Don&apos;t see an email?{" "}
                            <button
                                type="button"
                                disabled={isBusy}
                                onClick={handleRequestCode}
                                className="font-medium text-blue-600 not-italic hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isRequestingDisable2FA
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
                                variant="destructive"
                                disabled={isDisabling2FA || !isValid}
                                className="cursor-pointer"
                            >
                                {isDisabling2FA ? "Disabling..." : "Verify and disable"}
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="space-y-5 px-5 py-5">
                        <div className="flex gap-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-3 text-sm text-slate-700">
                            <ShieldOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

                            <div className="space-y-1">
                                <p className="font-medium text-slate-900">
                                    Your account will be less secure.
                                </p>

                                <p>
                                    After two-factor authentication is disabled, password
                                    sign-ins will no longer require a verification code from
                                    your email.
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
                                disabled={isRequestingDisable2FA}
                                onClick={handleRequestCode}
                                className="cursor-pointer"
                            >
                                {isRequestingDisable2FA
                                    ? "Sending..."
                                    : "Send verification code"}
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