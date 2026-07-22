"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { clearAuthLogoutLock } from "@/app/utils/auth-cache.util";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { useAuth } from "@/app/hooks/use-auth";

const otpPattern = /^(\d{6}|KNT-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4})$/i;

const adminLoginSchema = z.object({
  account: z.string().min(1, "Admin email or username is required"),
  password: z.string().min(1, "Password is required"),
  rememberDevice: z.boolean(),
  otp: z.string().optional(),
});

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loginStep, setLoginStep] = useState<"password" | "2fa">("password");
  const [twoFAChallenge, setTwoFAChallenge] = useState<{
    challengeId: string;
    maskedEmail: string;
  } | null>(null);

  const {
    loginMutation,
    verifyLogin2FAMutation,
    isLoggingIn,
    isVerifyingLogin2FA,
  } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    resetField,
    control,
    formState: { errors, isValid },
  } = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    mode: "onChange",
    defaultValues: {
      account: "",
      password: "",
      rememberDevice: true,
      otp: "",
    },
  });

  const otpValue = useWatch({ control, name: "otp" });

  const completeAdminLogin = () => {
    router.replace("/admin");
    router.refresh();
  };

  const onSubmit = (data: AdminLoginFormValues) => {
    clearAuthLogoutLock();

    if (loginStep === "2fa") {
      if (!twoFAChallenge) return;

      const otp = data.otp?.trim() ?? "";

      if (!otpPattern.test(otp)) {
        setError("otp", {
          type: "validate",
          message: "Enter a 6-digit authenticator code or recovery code.",
        });
        return;
      }

      verifyLogin2FAMutation.mutate(
        {
          challengeId: twoFAChallenge.challengeId,
          otp,
        },
        {
          onSuccess: completeAdminLogin,
        },
      );
      return;
    }

    loginMutation.mutate(
      {
        loginDto: {
          account: data.account.trim(),
          password: data.password,
        },
      },
      {
        onSuccess: (result) => {
          if ("requires2FA" in result) {
            setTwoFAChallenge({
              challengeId: result.challengeId,
              maskedEmail: result.maskedEmail,
            });
            resetField("otp");
            clearErrors("otp");
            setLoginStep("2fa");
            return;
          }

          completeAdminLogin();
        },
      },
    );
  };

  const goBackToPasswordStep = () => {
    setLoginStep("password");
    setTwoFAChallenge(null);
    resetField("otp");
    clearErrors("otp");
  };

  const isSubmitting = loginStep === "2fa" ? isVerifyingLogin2FA : isLoggingIn;
  const isSubmitDisabled =
    isSubmitting || (loginStep === "2fa" ? !otpValue?.trim() : !isValid);

  return (
    <main className="relative min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Subtle Dot Pattern Background */}
      <div className="absolute inset-0 z-0 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [bg-size:16px_16px] opacity-70"></div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8">
        {/* Header */}
        <header className="flex h-14 items-center justify-between">
          <Link
            href="/"
            className="group inline-flex items-center gap-2.5 text-sm font-semibold text-blue-600 transition hover:text-blue-900"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-800 text-base font-bold text-white shadow-md transition-transform group-hover:scale-105">
              K
            </div>
            <span className="text-base tracking-tight">Konekt Admin</span>
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm sm:flex">
            <ShieldCheck className="size-4" />
            Protected Access
          </div>
        </header>

        {/* Main Form Content */}
        <section className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-10">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Admin Portal
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Sign in to manage your workspace
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {loginStep === "2fa" && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                    <button
                      type="button"
                      onClick={goBackToPasswordStep}
                      className="group mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition hover:text-blue-800"
                    >
                      <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
                      Back to login
                    </button>
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="mt-0.5 size-5 text-blue-600" />
                      <div>
                        <p className="font-semibold text-slate-900">
                          Two-factor Verification
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">
                          Enter the code from your authenticator app or use a
                          recovery code to continue.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {loginStep === "password" && (
                <div className="animate-in fade-in zoom-in-95 duration-300 space-y-5">
                  <div className="space-y-2.5">
                    <Label
                      htmlFor="admin-account"
                      className="text-sm font-medium text-slate-700"
                    >
                      Email or Username
                    </Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 size-4.5 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="admin-account"
                        type="text"
                        autoComplete="username"
                        aria-invalid={Boolean(errors.account)}
                        placeholder="admin@konekt.com"
                        {...register("account")}
                        className="h-12 rounded-xl border-slate-200 bg-slate-50/50 pl-10 shadow-sm transition-all focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-500/20"
                      />
                    </div>
                    {errors.account && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.account.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <Label
                      htmlFor="admin-password"
                      className="text-sm font-medium text-slate-700"
                    >
                      Password
                    </Label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4.5 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="admin-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        aria-invalid={Boolean(errors.password)}
                        placeholder="Enter your password"
                        {...register("password")}
                        className="h-12 rounded-xl border-slate-200 bg-slate-50/50 pl-10 pr-12 shadow-sm transition-all focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-500/20"
                      />
                      <button
                        type="button"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        {showPassword ? (
                          <EyeOff className="size-4.5" />
                        ) : (
                          <Eye className="size-4.5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {loginStep === "2fa" && (
                <div className="space-y-2.5">
                  <Label
                    htmlFor="admin-otp"
                    className="text-sm font-medium text-slate-700"
                  >
                    Verification Code
                  </Label>
                  <Input
                    id="admin-otp"
                    type="text"
                    autoComplete="one-time-code"
                    aria-invalid={Boolean(errors.otp)}
                    placeholder="000000 or recovery code"
                    {...register("otp", {
                      onChange: () => clearErrors("otp"),
                    })}
                    className="h-12 rounded-xl border-slate-200 bg-slate-50/50 text-center text-lg tracking-widest shadow-sm transition-all focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-500/20 placeholder:text-sm placeholder:tracking-normal"
                  />
                  {errors.otp && (
                    <p className="text-xs font-medium text-red-500 text-center mt-1">
                      {errors.otp.message}
                    </p>
                  )}
                  {twoFAChallenge?.maskedEmail && (
                    <p className="text-xs text-slate-500 text-center mt-2">
                      Challenge sent for{" "}
                      <strong>{twoFAChallenge.maskedEmail}</strong>
                    </p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitDisabled}
                className="mt-2 h-12 w-full rounded-xl bg-blue-600 text-base font-semibold text-white shadow-md transition-all hover:bg-blue-700 focus:ring-2 disabled:bg-blue-100 disabled:text-slate-400 disabled:shadow-none cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="size-4" />
                    Checking access...
                  </span>
                ) : loginStep === "2fa" ? (
                  "Verify & Continue"
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-8 border-t border-slate-100 pt-6">
              <p className="text-center text-xs leading-relaxed text-slate-400">
                Protected administrative access. <br />
                Contact a system owner if your account needs elevated
                permissions.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
