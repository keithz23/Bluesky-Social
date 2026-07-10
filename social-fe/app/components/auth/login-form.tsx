"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useAuth } from "@/app/hooks/use-auth";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearAuthLogoutLock } from "@/app/utils/auth-cache.util";

const otpPattern = /^(\d{6}|KNT-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4})$/i;

const loginSchema = z.object({
  account: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
  otp: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loginStep, setLoginStep] = useState<"password" | "2fa">("password");
  const [twoFAChallenge, setTwoFAChallenge] = useState<{
    challengeId: string;
    maskedEmail: string;
  } | null>(null);

  const googleAuthUrl = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/auth/google`
    : "";
  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    resetField,
    formState: { errors, isValid },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      account: "",
      password: "",
      otp: "",
    },
  });
  const {
    loginMutation,
    verifyLogin2FAMutation,
    isLoggingIn,
    isVerifyingLogin2FA,
  } = useAuth();

  const otpValue = watch("otp");

  const onSubmit = (data: LoginFormValues) => {
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
          onSuccess: () => {
            router.replace("/");
            router.refresh();
          },
          onError: (error) => {
            console.error("2FA verification error:", error);
          },
        },
      );
      return;
    }

    loginMutation.mutate(
      {
        loginDto: {
          account: data.account,
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

          router.replace("/");
          router.refresh();
        },
        onError: (error) => {
          console.error("Login error:", error);
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`w-full ${loginStep === "2fa" ? "space-y-4" : "space-y-4"}`}
    >
      {loginStep === "2fa" && (
        <div className="space-y-2 rounded-[16px] bg-[#eef4ff] px-4 py-3 text-sm text-slate-700">
          <button
            type="button"
            onClick={goBackToPasswordStep}
            className="mb-0.5 inline-flex cursor-pointer items-center gap-2 font-medium text-blue-600 hover:underline"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
          <p className="font-normal text-slate-950">Enter authenticator code</p>
          <p className="leading-5 text-slate-700">
            Open your authenticator app and enter the 6-digit code. You can also
            use a recovery code.
          </p>
        </div>
      )}

      {loginStep === "password" && googleAuthUrl && (
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full rounded-full border-slate-300 bg-white text-sm font-medium shadow-none hover:bg-slate-50"
          onClick={() => {
            clearAuthLogoutLock();
            window.location.href = googleAuthUrl;
          }}
        >
          <span className="text-base font-black text-blue-600">G</span>
          Continue with Google
        </Button>
      )}

      {loginStep === "password" && googleAuthUrl && (
        <div className="flex items-center gap-4 py-2">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-medium uppercase text-slate-500">
            OR
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
      )}

      {loginStep === "password" && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="account" className="sr-only">
              Email or username
            </Label>
            <div className="relative">
              <Input
                id="account"
                type="text"
                autoComplete="username"
                placeholder="Email or username *"
                aria-invalid={Boolean(errors.account)}
                {...register("account")}
                className={`h-14 rounded-[18px] border-none bg-[#eef3f6] px-4 text-base font-medium shadow-none placeholder:text-slate-500 focus-visible:bg-white focus-visible:ring-blue-600/35
                  ${errors.account ? "bg-red-50 ring-2 ring-red-500 focus-visible:ring-red-500/30" : ""}
                `}
              />
            </div>
            {errors.account && (
              <p className="ml-1 text-xs font-medium text-red-500">
                {errors.account.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="sr-only">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Password *"
                aria-invalid={Boolean(errors.password)}
                {...register("password")}
                className={`h-14 rounded-[18px] border-none bg-[#eef3f6] px-4 pr-12 text-base font-medium shadow-none placeholder:text-slate-500 focus-visible:bg-white focus-visible:ring-blue-600/35
                  ${errors.password ? "bg-red-50 ring-2 ring-red-500 focus-visible:ring-red-500/30" : ""}
                `}
              />

              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-slate-800 transition hover:bg-slate-200"
                tabIndex={1}
              >
                {showPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="ml-1 text-xs font-medium text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>
        </>
      )}

      {loginStep === "2fa" && (
        <div className="space-y-1.5 pt-2">
          <Label htmlFor="verificationCode" className="sr-only">
            Authenticator or recovery code
          </Label>
          <div className="relative">
            <Input
              id="verificationCode"
              type="text"
              autoComplete="one-time-code"
              placeholder="000000 or recovery code"
              aria-invalid={Boolean(errors.otp)}
              {...register("otp", {
                onChange: () => clearErrors("otp"),
              })}
              className={`h-14 rounded-[16px] border-none bg-[#eef3f6] px-4 text-base font-medium shadow-none placeholder:text-slate-500 focus-visible:bg-white focus-visible:ring-blue-600/35
                ${errors.otp ? "bg-red-50 ring-2 ring-red-500 focus-visible:ring-red-500/30" : ""}
              `}
            />
          </div>
          {errors.otp && (
            <p className="ml-1 text-xs font-medium text-red-500">
              {errors.otp.message}
            </p>
          )}
        </div>
      )}

      {loginStep === "password" && (
        <div className="space-y-3 pt-2 text-sm">
          <Link
            href="/forgot"
            className="font-medium text-blue-600 hover:underline"
            tabIndex={1}
          >
            Forgot password?
          </Link>
          <p className="text-slate-700">
            New to Konekt?{" "}
            <Link
              href="/signup"
              className="font-medium text-blue-600 hover:underline"
              tabIndex={1}
            >
              Sign Up
            </Link>
          </p>
        </div>
      )}

      <Button
        type="submit"
        className={`${loginStep === "2fa" ? "mt-6 h-12" : "mt-2 h-12"} w-full rounded-full bg-blue-600 font-bold text-white shadow-none hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400`}
        disabled={isSubmitDisabled}
      >
        {isSubmitting ? (
          <>
            <Spinner /> Processing
          </>
        ) : loginStep === "2fa" ? (
          "Verify Code"
        ) : (
          "Log In"
        )}
      </Button>
    </form>
  );
}
