"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Mail,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
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
import {
  Enable2FAStep,
  TOTPSetupData,
  TwoFactorMethod,
} from "@/app/interfaces/dialog/dialog.interface";

interface Enable2FADialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email?: string;
}

const emailOtpSchema = z.object({
  otp: z
    .string()
    .trim()
    .min(1, "Verification code is required.")
    .regex(
      /^[A-Za-z0-9]{5}-?[A-Za-z0-9]{5}$/,
      "Verification code should look like XXXXX-XXXXX.",
    ),
});

const totpSchema = z.object({
  otp: z
    .string()
    .trim()
    .min(1, "Authentication code is required.")
    .regex(/^\d{6}$/, "Enter the 6-digit code from your authenticator app."),
});

type EmailOtpValues = z.infer<typeof emailOtpSchema>;
type TOTPValues = z.infer<typeof totpSchema>;

function maskEmail(email?: string) {
  if (!email) return "your account email";

  const [localPart, domain] = email.split("@");

  if (!domain) return email;

  const visibleLength = Math.min(2, localPart.length);
  const visiblePart = localPart.slice(0, visibleLength);
  const hiddenPart = "*".repeat(Math.max(3, localPart.length - visibleLength));

  return `${visiblePart}${hiddenPart}@${domain}`;
}

export default function Enable2FADialog({
  open,
  onOpenChange,
  email,
}: Enable2FADialogProps) {
  const [step, setStep] = useState<Enable2FAStep>("select-method");

  const [selectedMethod, setSelectedMethod] = useState<TwoFactorMethod>("totp");

  const [totpSetup, setTOTPSetup] = useState<TOTPSetupData | null>(null);

  const [secretCopied, setSecretCopied] = useState(false);
  const [recoveryCodesCopied, setRecoveryCodesCopied] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [setupPassword, setSetupPassword] = useState("");

  const emailForm = useForm<EmailOtpValues>({
    resolver: zodResolver(emailOtpSchema),
    mode: "onChange",
    defaultValues: {
      otp: "",
    },
  });

  const totpForm = useForm<TOTPValues>({
    resolver: zodResolver(totpSchema),
    mode: "onChange",
    defaultValues: {
      otp: "",
    },
  });

  const {
    requestEnable2FAMutation,
    enable2FAMutation,

    requestTOTPSetupMutation,
    enableTOTPMutation,

    isRequestingEnable2FA,
    isEnable2FA,
    isRequestingTOTPSetup,
    isEnablingTOTP,
  } = useAccountSettings({
    onRequestEnable2FACodeSuccess: () => {
      setStep("email-verification");

      window.setTimeout(() => {
        emailForm.setFocus("otp");
      }, 100);
    },

    onEnable2FASuccess: (data) => {
      setRecoveryCodes(data.recoveryCodes ?? []);
      setStep("recovery-codes");
    },

    onRequestTOTPSetupSuccess: (data: TOTPSetupData) => {
      setTOTPSetup(data);
      setStep("totp-setup");

      window.setTimeout(() => {
        totpForm.setFocus("otp");
      }, 100);
    },

    onEnableTOTPSuccess: (data) => {
      setRecoveryCodes(data.recoveryCodes ?? []);
      setStep("recovery-codes");
    },
  });

  const isBusy =
    isRequestingEnable2FA ||
    isEnable2FA ||
    isRequestingTOTPSetup ||
    isEnablingTOTP;

  const resetDialog = () => {
    emailForm.reset();
    totpForm.reset();

    setStep("select-method");
    setSelectedMethod("totp");
    setTOTPSetup(null);
    setSecretCopied(false);
    setRecoveryCodesCopied(false);
    setRecoveryCodes([]);
    setSetupPassword("");
  };

  const closeDialog = () => {
    resetDialog();
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isBusy) return;

    if (!nextOpen) {
      resetDialog();
    }

    onOpenChange(nextOpen);
  };

  const handleContinue = () => {
    requestTOTPSetupMutation.mutate({
      password: setupPassword,
    });
  };

  const handleEnableEmail2FA = (data: EmailOtpValues) => {
    enable2FAMutation.mutate({
      otp: data.otp.trim(),
    });
  };

  const handleEnableTOTP = (data: TOTPValues) => {
    enableTOTPMutation.mutate({
      otp: data.otp.trim(),
    });
  };

  const handleBack = () => {
    if (isBusy) return;

    emailForm.reset();
    totpForm.reset();

    setStep("select-method");
    setTOTPSetup(null);
    setSecretCopied(false);
    setRecoveryCodesCopied(false);
    setRecoveryCodes([]);
  };

  const handleResendEmailCode = () => {
    if (isBusy) return;

    emailForm.reset();
    requestEnable2FAMutation.mutate({
      password: setupPassword,
    });
  };

  const handleCopySecret = async () => {
    if (!totpSetup?.secret) return;

    try {
      await navigator.clipboard.writeText(totpSetup.secret);

      setSecretCopied(true);

      window.setTimeout(() => {
        setSecretCopied(false);
      }, 2000);
    } catch {
      setSecretCopied(false);
    }
  };

  const handleCopyRecoveryCodes = async () => {
    if (!recoveryCodes.length) return;

    try {
      await navigator.clipboard.writeText(recoveryCodes.join("\n"));
      setRecoveryCodesCopied(true);

      window.setTimeout(() => {
        setRecoveryCodesCopied(false);
      }, 2000);
    } catch {
      setRecoveryCodesCopied(false);
    }
  };

  const getDialogTitle = () => {
    switch (step) {
      case "email-verification":
        return "Verify your email";

      case "totp-setup":
        return "Set up an authenticator app";

      case "recovery-codes":
        return "Save your recovery codes";

      default:
        return "Enable two-factor authentication";
    }
  };

  const getDialogDescription = () => {
    switch (step) {
      case "email-verification":
        return "Enter the verification code we sent to your account email.";

      case "totp-setup":
        return "Scan the QR code and enter the code generated by your authenticator app.";

      case "recovery-codes":
        return "Store these codes somewhere safe. Each code can be used once if you lose access to your authenticator app.";

      default:
        return "Choose how you want to verify your identity when signing in.";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-md"
        onInteractOutside={(event) => {
          if (isBusy) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (isBusy) event.preventDefault();
        }}
      >
        <DialogHeader className="border-b border-slate-200 px-5 py-4 text-left">
          <DialogTitle className="text-lg font-bold text-slate-950">
            {getDialogTitle()}
          </DialogTitle>

          <DialogDescription className="text-sm leading-5 text-slate-500">
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>

        {step === "select-method" && (
          <MethodSelectionStep
            method={selectedMethod}
            isBusy={isBusy}
            password={setupPassword}
            onMethodChange={setSelectedMethod}
            onPasswordChange={setSetupPassword}
            onCancel={closeDialog}
            onContinue={handleContinue}
          />
        )}

        {step === "email-verification" && (
          <form
            className="space-y-5 px-5 py-5"
            onSubmit={emailForm.handleSubmit(handleEnableEmail2FA)}
          >
            <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <Mail className="h-5 w-5 shrink-0 text-blue-600" />

              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">
                  Verification code sent to
                </p>

                <p className="truncate text-sm font-semibold text-slate-900">
                  {maskEmail(email)}
                </p>
              </div>
            </div>

            <FieldGroup>
              <Field>
                <Label htmlFor="enable-email-2fa-otp">Verification code</Label>

                <Input
                  id="enable-email-2fa-otp"
                  inputMode="text"
                  autoComplete="one-time-code"
                  placeholder="XXXXX-XXXXX"
                  maxLength={11}
                  disabled={isBusy}
                  aria-invalid={Boolean(emailForm.formState.errors.otp)}
                  aria-describedby={
                    emailForm.formState.errors.otp
                      ? "enable-email-2fa-otp-error"
                      : undefined
                  }
                  {...emailForm.register("otp")}
                  className={`h-12 rounded-xl border bg-slate-100 px-4 text-[15px] uppercase tracking-wider transition-colors focus-visible:bg-white focus-visible:ring-0 ${
                    emailForm.formState.errors.otp
                      ? "border-red-500 focus-visible:border-red-500"
                      : "border-transparent focus-visible:border-blue-500"
                  }`}
                />

                {emailForm.formState.errors.otp && (
                  <p
                    id="enable-email-2fa-otp-error"
                    role="alert"
                    className="ml-1 text-xs font-medium text-red-500"
                  >
                    {emailForm.formState.errors.otp.message}
                  </p>
                )}
              </Field>
            </FieldGroup>

            <p className="text-sm text-slate-500">
              Didn&apos;t receive the email?{" "}
              <button
                type="button"
                disabled={isBusy}
                onClick={handleResendEmailCode}
                className="font-medium text-blue-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRequestingEnable2FA ? "Resending..." : "Resend code"}
              </button>
            </p>

            <DialogFooter className="gap-2 sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                disabled={isBusy}
                onClick={handleBack}
                className="cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              <Button
                type="submit"
                disabled={isBusy || !emailForm.formState.isValid}
                className="cursor-pointer"
              >
                {isEnable2FA ? "Enabling..." : "Verify and enable"}
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === "totp-setup" && (
          <form
            className="space-y-5 px-5 py-5"
            onSubmit={totpForm.handleSubmit(handleEnableTOTP)}
          >
            <div className="space-y-3">
              <div className="flex justify-center rounded-xl border border-slate-200 bg-white p-4">
                {totpSetup?.qrCodeDataUrl ? (
                  <img
                    src={totpSetup.qrCodeDataUrl}
                    alt="Authenticator app QR code"
                    className="h-44 w-44"
                  />
                ) : (
                  <div className="flex h-44 w-44 items-center justify-center text-sm text-slate-500">
                    Loading QR code...
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500">
                      Can&apos;t scan the QR code?
                    </p>

                    <p className="mt-1 break-all font-mono text-sm font-medium text-slate-900">
                      {totpSetup?.secret ?? "Loading setup key..."}
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={isBusy || !totpSetup?.secret}
                    onClick={handleCopySecret}
                    aria-label="Copy setup key"
                    className="shrink-0 cursor-pointer"
                  >
                    {secretCopied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <FieldGroup>
              <Field>
                <Label htmlFor="enable-totp-code">Authentication code</Label>

                <Input
                  id="enable-totp-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  maxLength={6}
                  disabled={isBusy}
                  aria-invalid={Boolean(totpForm.formState.errors.otp)}
                  aria-describedby={
                    totpForm.formState.errors.otp
                      ? "enable-totp-code-error"
                      : undefined
                  }
                  {...totpForm.register("otp", {
                    onChange: (event) => {
                      event.target.value = event.target.value.replace(
                        /\D/g,
                        "",
                      );
                    },
                  })}
                  className={`h-12 rounded-xl border bg-slate-100 px-4 text-center text-lg tracking-[0.4em] transition-colors focus-visible:bg-white focus-visible:ring-0 ${
                    totpForm.formState.errors.otp
                      ? "border-red-500 focus-visible:border-red-500"
                      : "border-transparent focus-visible:border-blue-500"
                  }`}
                />

                {totpForm.formState.errors.otp && (
                  <p
                    id="enable-totp-code-error"
                    role="alert"
                    className="ml-1 text-xs font-medium text-red-500"
                  >
                    {totpForm.formState.errors.otp.message}
                  </p>
                )}
              </Field>
            </FieldGroup>

            <DialogFooter className="gap-2 sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                disabled={isBusy}
                onClick={handleBack}
                className="cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              <Button
                type="submit"
                disabled={isBusy || !totpSetup || !totpForm.formState.isValid}
                className="cursor-pointer"
              >
                {isEnablingTOTP ? "Enabling..." : "Verify and enable"}
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === "recovery-codes" && (
          <RecoveryCodesStep
            codes={recoveryCodes}
            copied={recoveryCodesCopied}
            onCopy={handleCopyRecoveryCodes}
            onDone={closeDialog}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type RecoveryCodesStepProps = {
  codes: string[];
  copied: boolean;
  onCopy: () => void;
  onDone: () => void;
};

function RecoveryCodesStep({
  codes,
  copied,
  onCopy,
  onDone,
}: RecoveryCodesStepProps) {
  return (
    <div className="space-y-5 px-5 py-5">
      <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-900">
        These recovery codes are shown only once. Save them before closing this
        dialog.
      </div>

      <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
        {codes.map((code) => (
          <code
            key={code}
            className="rounded-lg bg-white px-3 py-2 font-mono text-sm font-semibold text-slate-900"
          >
            {code}
          </code>
        ))}
      </div>

      <DialogFooter className="gap-2 sm:justify-between">
        <Button
          type="button"
          variant="outline"
          disabled={!codes.length}
          onClick={onCopy}
          className="cursor-pointer"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copied ? "Copied" : "Copy codes"}
        </Button>

        <Button type="button" onClick={onDone} className="cursor-pointer">
          Done
        </Button>
      </DialogFooter>
    </div>
  );
}

type MethodSelectionStepProps = {
  method: TwoFactorMethod;
  isBusy: boolean;
  password: string;
  onMethodChange: (method: TwoFactorMethod) => void;
  onPasswordChange: (password: string) => void;
  onCancel: () => void;
  onContinue: () => void;
};

function MethodSelectionStep({
  method,
  isBusy,
  password,
  onMethodChange,
  onPasswordChange,
  onCancel,
  onContinue,
}: MethodSelectionStepProps) {
  return (
    <div className="space-y-5 px-5 py-5">
      <div
        role="radiogroup"
        aria-label="Two-factor authentication method"
        className="space-y-3"
      >
        <MethodOption
          selected={method === "totp"}
          icon={<Smartphone className="h-5 w-5" />}
          title="Authenticator app"
          description="Use an app such as Google Authenticator or Microsoft Authenticator to generate verification codes."
          badge="Recommended"
          disabled={isBusy}
          onClick={() => onMethodChange("totp")}
        />
      </div>

      <FieldGroup>
        <Field>
          <Label htmlFor="enable-2fa-password">Current password</Label>
          <Input
            id="enable-2fa-password"
            type="password"
            autoComplete="current-password"
            value={password}
            disabled={isBusy}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder="Enter your password"
            className="h-12 rounded-xl border-transparent bg-slate-100 px-4 text-[15px] transition-colors focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-0"
          />
        </Field>
      </FieldGroup>

      <div className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-500">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          You can change your verification method later from your privacy and
          security settings.
        </p>
      </div>

      <DialogFooter className="gap-2 sm:justify-between">
        <Button
          type="button"
          variant="outline"
          disabled={isBusy}
          onClick={onCancel}
          className="cursor-pointer"
        >
          Cancel
        </Button>

        <Button
          type="button"
          disabled={isBusy || !password.trim()}
          onClick={onContinue}
          className="cursor-pointer"
        >
          {isBusy ? "Please wait..." : "Continue"}
        </Button>
      </DialogFooter>
    </div>
  );
}

type MethodOptionProps = {
  selected: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  disabled?: boolean;
  onClick: () => void;
};

function MethodOption({
  selected,
  icon,
  title,
  description,
  badge,
  disabled,
  onClick,
}: MethodOptionProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        selected
          ? "border-blue-500 bg-blue-50"
          : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          selected ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-600"
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-slate-900">{title}</p>

          {badge && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
              {badge}
            </span>
          )}
        </div>

        <p className="mt-1 text-sm leading-5 text-slate-600">{description}</p>
      </div>

      <div
        className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          selected ? "border-blue-600" : "border-slate-300"
        }`}
      >
        {selected && <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />}
      </div>
    </button>
  );
}
