"use client";

import { Label } from "@/components/ui/label";
import { AtSign, LockKeyhole } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useAuth } from "@/app/hooks/use-auth";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";

// 1. Define Zod Schema
const loginSchema = z.object({
  account: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

// Type inference
type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  // 2. Initialize Hook Form
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
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
          router.push("/");
        },
        onError: (error) => {
          console.error("Login error:", error);
        },
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-2xl space-y-6"
    >
      {/* --- Account Field --- */}
      <div className="space-y-1">
        <Label
          htmlFor="account"
          className="text-xs font-semibold text-gray-500"
        >
          Account
        </Label>

        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <AtSign
              className={`h-4 w-4 transition ${errors.account ? "text-red-400" : "text-gray-400 group-focus-within:text-blue-500"}`}
            />
          </div>
          <input
            id="account"
            type="text"
            placeholder="Username or email address"
            {...register("account")}
            className={`w-full bg-gray-100 border-none rounded-xl p-4 pl-10 pr-4 text-sm focus:ring-2 focus:bg-white transition
              ${errors.account ? "focus:ring-red-500 ring-1 ring-red-500 bg-red-50" : "focus:ring-blue-500"}
            `}
          />
        </div>
        {/* Error Message */}
        {errors.account && (
          <p className="text-red-500 text-xs mt-1 ml-1">
            {errors.account.message}
          </p>
        )}
      </div>

      {/* --- Password Field --- */}
      <div className="space-y-1">
        <Label
          htmlFor="password"
          className="text-xs font-semibold text-gray-500"
        >
          Password
        </Label>

        <div className="relative group">
          {/* Icon */}
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <LockKeyhole
              className={`h-4 w-4 transition ${errors.password ? "text-red-400" : "text-gray-400 group-focus-within:text-blue-500"}`}
            />
          </div>

          {/* Input */}
          <input
            id="password"
            type="password"
            placeholder="Password"
            {...register("password")}
            className={`w-full bg-gray-100 border-none rounded-xl p-4 pl-10 pr-20 text-sm focus:ring-2 focus:bg-white transition
              ${errors.password ? "focus:ring-red-500 ring-1 ring-red-500 bg-red-50" : "focus:ring-blue-500"}
            `}
          />

          <Link href={"/forgot"}>
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-200 px-2 py-1 rounded-md cursor-pointer transition"
            >
              Forgot?
            </button>
          </Link>
        </div>

        {/* Error Message */}
        {errors.password && (
          <p className="text-red-500 text-xs mt-1 ml-1">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* --- Buttons --- */}
      <div className="flex items-center justify-between pt-4">
        <Link href={"/"}>
          <button
            type="button"
            className="px-6 py-2.5 rounded-full bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition cursor-pointer"
          >
            Back
          </button>
        </Link>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-sm cursor-pointer"
          disabled={isLoggingIn}
        >
          {isLoggingIn ? (
            <div className="flex items-center gap-x-3">
              <Spinner /> Processing
            </div>
          ) : (
            "Next"
          )}
        </button>
      </div>
    </form>
  );
}
