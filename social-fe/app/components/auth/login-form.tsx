"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useAuth } from "@/app/hooks/use-auth";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearAuthLogoutLock } from "@/app/utils/auth-cache.util";

const loginSchema = z.object({
  account: z.string().min(1, "Username or email is required"),
  password: z
    .string()
    .min(1, "Password is required")
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const googleAuthUrl = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/auth/google`
    : "";
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      account: "",
      password: "",
    },
  });
  const { loginMutation, isLoggingIn } = useAuth();

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(
      { loginDto: data },
      {
        onSuccess: () => {
          router.replace("/");
          router.refresh();
        },
        onError: (error) => {
          console.error("Login error:", error);
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
      {googleAuthUrl && (
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

      {googleAuthUrl && (
        <div className="flex items-center gap-4 py-2">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-medium uppercase text-slate-500">
            OR
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
      )}

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

      <div className="space-y-3 pt-2 text-sm">
        <Link href="/forgot" className="font-medium text-blue-600 hover:underline" tabIndex={1}>
          Forgot password?
        </Link>
        <p className="text-slate-700">
          New to Konekt?{" "}
          <Link href="/signup" className="font-medium text-blue-600 hover:underline" tabIndex={1}>
            Sign Up
          </Link>
        </p>
      </div>

      <Button
        type="submit"
        className="mt-2 h-12 w-full rounded-full bg-blue-600 font-bold text-white shadow-none hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400"
        disabled={isLoggingIn || !isValid}
      >
        {isLoggingIn ? (
          <>
            <Spinner /> Processing
          </>
        ) : (
          "Log In"
        )}
      </Button>
    </form>
  );
}
