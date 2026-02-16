import AuthBanner from "@/app/components/auth/auth-banner";
import ForgotForm from "@/app/components/auth/forgot-form";
import React from "react";

export default function ForgotPage() {
  return (
    <>
      <div className="min-h-screen grid grid-cols-1 md:grid-cols-3">
        <div className="col-span-1 flex flex-col justify-center items-end bg-[#f9fafb]">
          <AuthBanner
            title="Forgot Password"
            description="Let's get your password reset!"
          />
        </div>
        <div className="col-span-2 flex flex-col justify-center items-start px-12">
          <ForgotForm />
        </div>
      </div>
    </>
  );
}
