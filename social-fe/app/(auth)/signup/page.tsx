"use client"
import AuthBanner from "@/app/components/auth/auth-banner";
import RegisterForm from "@/app/components/auth/register-form";

export default function RegisterPage() {
  return (
    <>
      <div className="min-h-screen grid grid-cols-1 md:grid-cols-3">
        <div className="hidden md:flex col-span-1 flex-col justify-center items-end bg-[#f9fafb]">
          <AuthBanner
            title="Create Account"
            description="We're so excited to have you join us!"
          />
        </div>
        <div className="col-span-2 flex flex-col justify-center items-start px-12">
          <RegisterForm />
        </div>
      </div>
    </>
  );
}
