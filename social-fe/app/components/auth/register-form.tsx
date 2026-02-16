"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { AtSign, Calendar, LockKeyhole } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useAuth } from "@/app/hooks/use-auth";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";

// --- SCHEMAS ---

// Schema Step 1: Account Info
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

// Schema Step 2: Username
const step2Schema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9]+$/, "Username can only contain letters and numbers"),
});

// Types
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
    <div className="w-full max-w-2xl mx-auto">
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

// --- COMPONENT STEP 1 ---
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
    formState: { errors },
  } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      email: defaultValues?.email || "",
      password: defaultValues?.password || "",
      dateOfBirth: defaultValues?.dateOfBirth || "2000-01-01",
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onNext)}
      className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300"
    >
      <div className="space-y-1">
        <span className="text-gray-500 font-medium">Step 1 of 2</span>
        <h1 className="text-2xl text-gray-900 font-bold">Your account</h1>
      </div>

      <div className="pt-2">
        <p className="text-gray-500">
          You are creating an account on{" "}
          <span className="text-gray-700 font-semibold">Bluesky Social</span>
        </p>
      </div>

      <div className="space-y-4">
        {/* Email */}
        <div className="space-y-1">
          <Label className="text-xs font-bold text-gray-500 uppercase">
            Email
          </Label>
          <div className="relative group">
            <AtSign className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Enter your email address"
              {...register("email")}
              className={`w-full bg-gray-100/50 border-none rounded-xl p-4 pl-10 pr-4 text-sm focus:ring-2 focus:bg-white transition ${errors.email ? "ring-2 ring-red-500 bg-red-50" : "focus:ring-blue-500"}`}
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-xs font-medium">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <Label className="text-xs font-bold text-gray-500 uppercase">
            Password
          </Label>
          <div className="relative group">
            <LockKeyhole className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              {...register("password")}
              className={`w-full bg-gray-100/50 border-none rounded-xl p-4 pl-10 pr-4 text-sm focus:ring-2 focus:bg-white transition ${errors.password ? "ring-2 ring-red-500 bg-red-50" : "focus:ring-blue-500"}`}
            />
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs font-medium">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Date of Birth */}
        <div className="space-y-1">
          <Label className="text-xs font-bold text-gray-500 uppercase">
            Your birth date
          </Label>
          <div className="relative group">
            <Calendar className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
            <input
              type="date"
              {...register("dateOfBirth")}
              className={`w-full bg-gray-100/50 border-none rounded-xl p-4 pl-10 pr-4 text-sm focus:ring-2 focus:bg-white transition ${errors.dateOfBirth ? "ring-2 ring-red-500 bg-red-50" : "focus:ring-blue-500"}`}
            />
          </div>
          {errors.dateOfBirth && (
            <p className="text-red-500 text-xs font-medium">
              {errors.dateOfBirth.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <Link href={"/"}>
          <button
            type="button"
            className="px-6 py-2.5 rounded-full bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition cursor-pointer"
          >
            Back
          </button>
        </Link>

        <button
          type="submit"
          className="px-8 py-2.5 rounded-full bg-blue-500 text-white font-bold hover:bg-blue-600 transition shadow-sm cursor-pointer"
        >
          Next
        </button>
      </div>
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
    formState: { errors },
  } = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300"
    >
      <div className="space-y-1">
        <span className="text-gray-500 font-medium text-sm">Step 2 of 2</span>
        <h1 className="text-2xl text-gray-900 font-bold">
          Choose your username
        </h1>
      </div>

      <div className="pt-6 pb-20">
        <div
          className={`
          flex items-center w-full bg-gray-100 rounded-xl px-4 py-3 border-2 transition-all
          ${errors.username ? "border-red-500 bg-red-50" : "border-transparent focus-within:border-blue-500 focus-within:bg-white"}
        `}
        >
          <span className="text-gray-400 text-lg font-medium mr-1">@</span>

          <input
            type="text"
            placeholder="username"
            {...register("username")}
            className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder:text-gray-400 font-medium"
            autoFocus
          />
        </div>

        {errors.username && (
          <p className="text-red-500 text-sm mt-2 font-medium ml-1">
            {errors.username.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-8 py-2.5 rounded-full bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition cursor-pointer"
        >
          Back
        </button>

        <button
          type="submit"
          className="px-8 py-2.5 rounded-full bg-blue-500 text-white font-bold hover:bg-blue-600 transition shadow-sm cursor-pointer"
          disabled={isRegistering}
        >
          {isRegistering ? (
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
