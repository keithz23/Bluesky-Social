"use client";

import AuthBanner from "@/app/components/auth/auth-banner";
import LoginForm from "@/app/components/auth/login-form";

export default function LoginPage() {
  return (
    <>
      <div className="min-h-screen grid grid-cols-1 md:grid-cols-3">
        <div className="col-span-1 flex flex-col justify-center items-end bg-[#f9fafb]">
        <AuthBanner title="Sign in" description="Enter your username and password"/>
        </div>
        <div className="col-span-2 flex flex-col justify-center items-start px-12">
          <LoginForm/>
        </div>
      </div>
    </>
  );
}
