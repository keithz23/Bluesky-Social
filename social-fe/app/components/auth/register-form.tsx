"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AtSign, Calendar, LockKeyhole } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useAuth } from "@/app/hooks/use-auth";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";

const step1Schema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain uppercase, lowercase, number and special character",
    ),

  dateOfBirth: z.string().refine((date) => {
    const age = new Date().getFullYear() - new Date(date).getFullYear();
    return age >= 13;
  }, "You must be at least 13 years old"),
});

const step2Schema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9]+$/, "Username can only contain letters and numbers"),
});

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;

export default function RegisterFlow() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const { signupMutation, isRegistering } = useAuth();
  const [formData, setFormData] = useState<Partial<Step1Values & Step2Values>>(
    {},
  );

  const onStep1Submit = (data: Step1Values) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(2);
  };

  const onStep2Submit = (data: Step2Values) => {
    const finalData = { ...formData, ...data } as Step1Values & Step2Values;
    signupMutation.mutate(
      { registerDto: finalData },
      {
        onSuccess: () => {
          router.push("/login");
        },
        onError: (error) => {
          console.error("Signup error:", error);
        },
      },
    );
  };

  return (
    <div className="w-full">
      {step === 1 && (
        <Step1Form
          defaultValues={formData as Step1Values}
          onNext={onStep1Submit}
        />
      )}

      {step === 2 && (
        <Step2Form
          onBack={() => setStep(1)}
          onSubmit={onStep2Submit}
          isRegistering={isRegistering}
        />
      )}
    </div>
  );
}

function Step1Form({
  onNext,
  defaultValues,
}: {
  onNext: (data: Step1Values) => void;
  defaultValues: Step1Values;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    mode: "onChange",
    defaultValues: {
      email: defaultValues?.email || "",
      password: defaultValues?.password || "",
      dateOfBirth: defaultValues?.dateOfBirth || "2000-01-01",
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onNext)}
      className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300"
    >
      <div className="space-y-1 text-center">
        <span className="text-sm font-medium text-slate-500">Step 1 of 2</span>
        <p className="text-sm font-medium text-slate-700">
          Create your Konekt account.
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="sr-only" htmlFor="signup-email">
            Email
          </Label>
          <div className="relative">
            <AtSign className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <Input
              id="signup-email"
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

        <div className="space-y-1.5">
          <Label className="sr-only" htmlFor="signup-password">
            Password
          </Label>
          <div className="relative">
            <LockKeyhole className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <Input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              placeholder="Password *"
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
              className={`h-14 rounded-[18px] border-none bg-[#eef3f6] pl-11 pr-4 text-base font-medium shadow-none placeholder:text-slate-500 focus-visible:bg-white focus-visible:ring-blue-600/35 ${errors.password ? "bg-red-50 ring-red-500 focus-visible:ring-red-500/30" : ""}`}
            />
          </div>
          {errors.password && (
            <p className="ml-1 text-xs font-medium text-red-500">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="sr-only" htmlFor="signup-date-of-birth">
            Your birth date
          </Label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <Input
              id="signup-date-of-birth"
              type="date"
              aria-invalid={Boolean(errors.dateOfBirth)}
              {...register("dateOfBirth")}
              className={`h-14 rounded-[18px] border-none bg-[#eef3f6] pl-11 pr-4 text-base font-medium shadow-none focus-visible:bg-white focus-visible:ring-blue-600/35 ${errors.dateOfBirth ? "bg-red-50 ring-2 ring-red-500 focus-visible:ring-red-500/30" : ""}`}
            />
          </div>
          {errors.dateOfBirth && (
            <p className="ml-1 text-xs font-medium text-red-500">
              {errors.dateOfBirth.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3 pt-2 text-sm">
        <p className="text-slate-700">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Log In
          </Link>
        </p>
      </div>

      <Button
        type="submit"
        className="h-12 w-full rounded-full bg-blue-600 font-bold text-white shadow-none hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400"
        disabled={!isValid}
      >
        Next
      </Button>
    </form>
  );
}

function Step2Form({
  onBack,
  onSubmit,
  isRegistering,
}: {
  onBack: () => void;
  onSubmit: (data: Step2Values) => void;
  isRegistering: boolean;
}) {
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
        <span className="text-sm font-medium text-slate-500">Step 2 of 2</span>
        <p className="text-sm font-medium text-slate-700">
          Choose your public username.
        </p>
      </div>

      <div className="pt-2">
        <div
          className={`
          flex h-14 w-full items-center rounded-[18px] bg-[#eef3f6] px-4 transition
          ${errors.username ? "bg-red-50 ring-2 ring-red-500" : "focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-600/35"}
        `}
        >
          <span className="mr-1 text-lg font-medium text-slate-500">@</span>

          <input
            type="text"
            placeholder="username"
            aria-invalid={Boolean(errors.username)}
            {...register("username")}
            className="flex-1 border-none bg-transparent font-medium text-slate-900 outline-none placeholder:text-slate-500"
            autoFocus
          />
        </div>

        {errors.username && (
          <p className="ml-1 mt-2 text-xs font-medium text-red-500">
            {errors.username.message}
          </p>
        )}
      </div>

      <div className="space-y-3 pt-2">
        <Button
          type="submit"
          className="h-12 w-full rounded-full bg-blue-600 font-bold text-white shadow-none hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400"
          disabled={isRegistering || !isValid}
        >
          {isRegistering ? (
            <>
              <Spinner /> Processing
            </>
          ) : (
            "Create account"
          )}
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
