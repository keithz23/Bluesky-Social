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
  LockKeyhole,
  Mail,
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
    <main className="min-h-dvh bg-[#f6f7f9] text-slate-950">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 py-6 sm:px-8">
        <header className="flex h-12 items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
          >
            <span className="flex size-8 items-center justify-center rounded-md bg-slate-950 text-sm font-bold text-white">
              K
            </span>
            Konekt Admin
          </Link>
          <span className="hidden items-center gap-2 text-xs font-medium text-slate-500 sm:inline-flex">
            <ShieldCheck className="size-4 text-blue-600" />
            Protected access
          </span>
        </header>

        <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1fr_440px] lg:py-14">
          <div className="max-w-xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
              <LockKeyhole className="size-4 text-blue-600" />
              Administrative console
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-normal text-slate-950 sm:text-5xl">
              Sign in to manage Konekt.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">
              Review platform activity, moderate reports, and manage access
              using an administrator account.
            </p>

            <div className="mt-10 grid max-w-lg gap-3 sm:grid-cols-3">
              {["Role-based access", "2FA ready", "Session protected"].map(
                (item) => (
                  <div
                    key={item}
                    className="rounded-md border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 shadow-sm"
                  >
                    {item}
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-7 mx-auto flex flex-col items-center">
              <h2 className="text-2xl font-bold tracking-normal text-slate-950">
                Admin sign in
              </h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {loginStep === "2fa" && (
                <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-slate-700">
                  <button
                    type="button"
                    onClick={goBackToPasswordStep}
                    className="mb-2 inline-flex cursor-pointer items-center gap-2 font-semibold text-blue-700 transition hover:text-blue-900"
                  >
                    <ArrowLeft className="size-4" />
                    Back
                  </button>
                  <p className="font-semibold text-slate-950">
                    Two-factor verification
                  </p>
                  <p className="mt-1 leading-5">
                    Enter the code from your authenticator app or use a recovery
                    code.
                  </p>
                </div>
              )}

              {loginStep === "password" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="admin-account">
                      Admin email or username
                    </Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="admin-account"
                        type="text"
                        autoComplete="username"
                        aria-invalid={Boolean(errors.account)}
                        placeholder="admin@konekt.com"
                        {...register("account")}
                        className="h-11 rounded-md border-slate-300 bg-white pl-10 shadow-none placeholder:text-slate-400 focus-visible:ring-blue-600/25"
                      />
                    </div>
                    {errors.account && (
                      <p className="text-xs font-medium text-red-600">
                        {errors.account.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="admin-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        aria-invalid={Boolean(errors.password)}
                        placeholder="Enter password"
                        {...register("password")}
                        className="h-11 rounded-md border-slate-300 bg-white pl-10 pr-11 shadow-none placeholder:text-slate-400 focus-visible:ring-blue-600/25"
                      />
                      <button
                        type="button"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs font-medium text-red-600">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                </>
              )}

              {loginStep === "2fa" && (
                <div className="space-y-2">
                  <Label htmlFor="admin-otp">Verification code</Label>
                  <Input
                    id="admin-otp"
                    type="text"
                    autoComplete="one-time-code"
                    aria-invalid={Boolean(errors.otp)}
                    placeholder="000000 or recovery code"
                    {...register("otp", {
                      onChange: () => clearErrors("otp"),
                    })}
                    className="h-11 rounded-md border-slate-300 bg-white shadow-none placeholder:text-slate-400 focus-visible:ring-blue-600/25"
                  />
                  {errors.otp && (
                    <p className="text-xs font-medium text-red-600">
                      {errors.otp.message}
                    </p>
                  )}
                  {twoFAChallenge?.maskedEmail && (
                    <p className="text-xs text-slate-500">
                      Challenge sent for {twoFAChallenge.maskedEmail}
                    </p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitDisabled}
                className="h-11 w-full rounded-md bg-slate-950 font-semibold text-white shadow-none hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-500"
              >
                {isSubmitting ? (
                  <>
                    <Spinner />
                    Checking access
                  </>
                ) : loginStep === "2fa" ? (
                  "Verify and continue"
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <p className="mt-6 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
              Protected administrative access. Contact a system owner if your
              account needs elevated permissions.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
