"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { AtSign, LockKeyhole, Ticket, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// --- SCHEMAS ---
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
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

// Types
type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;

export default function ForgotPasswordFlow() {
  const [step, setStep] = useState(1);
  const [emailData, setEmailData] = useState<string>("");

  const onStep1Submit = (data: Step1Values) => {
    setEmailData(data.email);
    console.log("Email sent to:", data.email);
    setStep(2);
  };

  const onStep2Submit = (data: Step2Values) => {
    const finalData = { email: emailData, ...data };
    console.log("Reset Password Data:", finalData);
    setStep(3);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col justify-center">
      {step === 1 && <Step1Form onNext={onStep1Submit} />}

      {step === 2 && (
        <Step2Form onBack={() => setStep(1)} onSubmit={onStep2Submit} />
      )}

      {step === 3 && <Step3Form />}
    </div>
  );
}

function Step1Form({ onNext }: { onNext: (data: Step1Values) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
  });

  return (
    <form
      onSubmit={handleSubmit(onNext)}
      className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300"
    >
      <div className="space-y-1">
        <h1 className="text-2xl text-gray-900 font-bold">Reset Password</h1>
        <p className="text-gray-500">
          Enter your email to receive a reset code.
        </p>
      </div>

      <div className="space-y-1">
        <Label
          htmlFor="email"
          className="text-xs font-semibold text-gray-500 uppercase"
        >
          Email
        </Label>
        <div className="relative group">
          <AtSign
            className={`absolute left-4 top-4 h-4 w-4 transition ${errors.email ? "text-red-400" : "text-gray-400 group-focus-within:text-blue-500"}`}
          />
          <input
            id="email"
            type="text"
            placeholder="Enter your email address"
            {...register("email")}
            className={`w-full bg-gray-100 border-none rounded-xl p-4 pl-10 pr-4 text-sm focus:ring-2 focus:bg-white transition ${errors.email ? "focus:ring-red-500 ring-1 ring-red-500 bg-red-50" : "focus:ring-blue-500"}`}
          />
        </div>
        {errors.email && (
          <p className="text-red-500 text-xs mt-1 ml-1">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-4">
        <Link href="/">
          <button
            type="button"
            className="px-6 py-2.5 rounded-full bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition cursor-pointer"
          >
            Back
          </button>
        </Link>
        <button
          type="submit"
          className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-s cursor-pointer"
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
}: {
  onBack: () => void;
  onSubmit: (data: Step2Values) => void;
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
      <div className="space-y-2">
        <p className="text-gray-900 font-medium">
          You will receive an email with a "reset code." Enter that code here,
          then enter your new password.
        </p>
      </div>

      <div className="space-y-4">
        {/* Reset Code Field */}
        <div className="space-y-1">
          <Label className="text-xs font-bold text-gray-500 uppercase">
            Reset code
          </Label>
          <div className="relative group">
            <Ticket
              className={`absolute left-4 top-4 h-4 w-4 transition ${errors.resetCode ? "text-red-400" : "text-gray-400 group-focus-within:text-blue-500"}`}
            />
            <input
              type="text"
              placeholder="Looks like XXXXX-XXXXX"
              {...register("resetCode")}
              className={`w-full bg-gray-100 border-none rounded-xl p-4 pl-10 pr-4 text-sm focus:ring-2 focus:bg-white transition
                ${errors.resetCode ? "focus:ring-red-500 ring-1 ring-red-500 bg-red-50" : "focus:ring-blue-500"}
              `}
            />
          </div>
        </div>

        {/* New Password Field */}
        <div className="space-y-1">
          <Label className="text-xs font-bold text-gray-500 uppercase">
            New password
          </Label>
          <div className="relative group">
            <LockKeyhole
              className={`absolute left-4 top-4 h-4 w-4 transition ${errors.newPassword ? "text-red-400" : "text-gray-400 group-focus-within:text-blue-500"}`}
            />
            <input
              type="password"
              placeholder="Enter a password"
              {...register("newPassword")}
              className={`w-full bg-gray-100 border-none rounded-xl p-4 pl-10 pr-4 text-sm focus:ring-2 focus:bg-white transition
                ${errors.newPassword ? "focus:ring-red-500 ring-1 ring-red-500 bg-red-50" : "focus:ring-blue-500"}
              `}
            />
          </div>
          {errors.newPassword && (
            <p className="text-red-500 text-xs mt-1 ml-1">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        {errors.resetCode && (
          <div className="flex items-start gap-3 bg-red-500 text-white p-4 rounded-xl animate-in slide-in-from-top-2">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{errors.resetCode.message}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-8 py-2.5 rounded-full bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition cursor-pointer"
        >
          Back
        </button>

        <button
          type="submit"
          className="px-8 py-2.5 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-sm cursor-pointer"
        >
          Next
        </button>
      </div>
    </form>
  );
}

function Step3Form() {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-3">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Password updated!
        </h1>
        <p className="text-gray-600">
          You can now sign in with your new password.
        </p>
      </div>

      <Link href="/login">
        <button
          type="button"
          className="px-8 py-2.5 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-sm cursor-pointer mt-2"
        >
          Okay
        </button>
      </Link>
    </div>
  );
}
