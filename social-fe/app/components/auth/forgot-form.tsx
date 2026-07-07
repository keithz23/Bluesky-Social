"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  AtSign,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/app/hooks/use-auth";
import { ResetPasswordData } from "@/app/interfaces/auth.interface";

const step1Schema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

const step2Schema = z.object({
  resetCode: z
    .string()
    .regex(
      /^[A-Za-z0-9]{5}-[A-Za-z0-9]{5}$/,
      "You have entered an invalid code. It should look like XXXXX-XXXXX.",
    ),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain uppercase, lowercase, number and special character",
    ),

});

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;

export default function ForgotPasswordFlow() {
  const [step, setStep] = useState(1);
  const [, setEmailData] = useState<string>("");
  const {
    forgotPasswordMutation,
    resetPasswordMutation,
    isForgotPassword,
    isResettingPassword,
  } = useAuth();

  const onStep1Submit = (data: Step1Values) => {
    setEmailData(data.email);
    forgotPasswordMutation.mutate(
      { email: data.email },
      {
        onSuccess: (response) => {
          if (response?.canResetPassword === false) return;
          setStep(2);
        },
        onError: (error) => {
          console.error("Error sending email:", error);
        },
      },
    );
  };

  const onStep2Submit = (data: Step2Values) => {
    const resetPasswordData: ResetPasswordData = {
      code: data.resetCode,
      newPassword: data.newPassword,
    };
    resetPasswordMutation.mutate(
      { resetPasswordData: resetPasswordData },
      {
        onSuccess: () => {
          setStep(3);
        },
        onError: (error) => {
          console.error("Error resetting password:", error);
        },
      },
    );
  };

  return (
    <div className="w-full">
      {step === 1 && (
        <Step1Form onNext={onStep1Submit} isSubmitting={isForgotPassword} />
      )}

      {step === 2 && (
        <Step2Form
          onBack={() => setStep(1)}
          onSubmit={onStep2Submit}
          isSubmitting={isResettingPassword}
        />
      )}

      {step === 3 && <Step3Form />}
    </div>
  );
}

function Step1Form({
  onNext,
  isSubmitting,
}: {
  onNext: (data: Step1Values) => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    mode: "onChange",
  });

  return (
    <form
      onSubmit={handleSubmit(onNext)}
      className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300"
    >
      <div className="space-y-1 text-center">
        <p className="text-sm font-medium text-slate-700">
          We will email you a reset code.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className="sr-only">
          Email
        </Label>
        <div className="relative">
          <AtSign
            className={`absolute left-4 top-1/2 size-4 -translate-y-1/2 transition ${errors.email ? "text-red-500" : "text-slate-500"}`}
          />
          <Input
            id="email"
            type="text"
            autoComplete="email"
            placeholder="Email *"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
            className={`h-14 rounded-[18px] border-none bg-[#eef3f6] pl-11 pr-4 text-base font-medium shadow-none placeholder:text-slate-500 focus-visible:bg-white focus-visible:ring-blue-600/35 ${errors.email ? "bg-red-50 ring-2 ring-red-500 focus-visible:ring-red-500/30" : ""}`}
          />
        </div>
        {errors.email && (
          <p className="ml-1 text-xs font-medium text-red-500">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-3 pt-2 text-sm">
        <p className="text-slate-700">
          Remember your password?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Log In
          </Link>
        </p>
      </div>

      <Button
        type="submit"
        className="h-12 w-full rounded-full bg-blue-600 font-bold text-white shadow-none hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400"
        disabled={isSubmitting || !isValid}
      >
        {isSubmitting ? "Sending..." : "Send reset code"}
      </Button>
    </form>
  );
}

function Step2Form({
  onBack,
  onSubmit,
  isSubmitting,
}: {
  onBack: () => void;
  onSubmit: (data: Step2Values) => void;
  isSubmitting: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    mode: "onChange",
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300"
    >
      <div className="space-y-1 text-center">
        <p className="text-sm font-medium text-slate-700">
          Enter the code from your email and choose a new password.
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="sr-only" htmlFor="reset-code">
            Reset code
          </Label>
          <div className="relative">
            <Ticket
              className={`absolute left-4 top-1/2 size-4 -translate-y-1/2 transition ${errors.resetCode ? "text-red-500" : "text-slate-500"}`}
            />
            <Input
              id="reset-code"
              type="text"
              placeholder="Reset code *"
              aria-invalid={Boolean(errors.resetCode)}
              {...register("resetCode")}
              className={`h-14 rounded-[18px] border-none bg-[#eef3f6] pl-11 pr-4 text-base font-medium shadow-none placeholder:text-slate-500 focus-visible:bg-white focus-visible:ring-blue-600/35 ${errors.resetCode ? "bg-red-50 ring-2 ring-red-500 focus-visible:ring-red-500/30" : ""}`}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="sr-only" htmlFor="new-password">
            New password
          </Label>
          <div className="relative">
            <LockKeyhole
              className={`absolute left-4 top-1/2 size-4 -translate-y-1/2 transition ${errors.newPassword ? "text-red-500" : "text-slate-500"}`}
            />
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="New password *"
              aria-invalid={Boolean(errors.newPassword)}
              {...register("newPassword")}
              className={`h-14 rounded-[18px] border-none bg-[#eef3f6] pl-11 pr-12 text-base font-medium shadow-none placeholder:text-slate-500 focus-visible:bg-white focus-visible:ring-blue-600/35 ${errors.newPassword ? "bg-red-50 ring-2 ring-red-500 focus-visible:ring-red-500/30" : ""}`}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-slate-800 transition hover:bg-slate-200"
            >
              {showPassword ? (
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
        </div>

        {errors.resetCode && (
          <div className="flex items-start gap-3 rounded-[18px] bg-red-500 p-4 text-white animate-in slide-in-from-top-2">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            <p className="text-sm font-medium">{errors.resetCode.message}</p>
          </div>
        )}
      </div>

      <div className="space-y-3 pt-2">
        <Button
          type="submit"
          className="h-12 w-full rounded-full bg-blue-600 font-bold text-white shadow-none hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400"
          disabled={isSubmitting || !isValid}
        >
          {isSubmitting ? "Updating..." : "Reset password"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-12 w-full rounded-full border-slate-300 font-bold shadow-none"
        >
          Back
        </Button>
      </div>
    </form>
  );
}

function Step3Form() {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CheckCircle2 className="size-12 text-blue-600" />
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-slate-900">
          Password updated!
        </h2>
        <p className="text-sm font-medium text-slate-600">
          You can now sign in with your new password.
        </p>
      </div>

      <Button asChild className="h-12 w-full rounded-full bg-blue-600 font-bold text-white shadow-none hover:bg-blue-700">
        <Link href="/login">
          Okay
        </Link>
      </Button>
    </div>
  );
}
