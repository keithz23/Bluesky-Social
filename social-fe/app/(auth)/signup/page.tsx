"use client";
import AuthShell from "@/app/components/auth/auth-shell";
import RegisterForm from "@/app/components/auth/register-form";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Sign Up"
      description={
        <>
          By continuing, you agree to our{" "}
          <Link href="/" className="text-blue-600 hover:underline">
            User Agreement
          </Link>{" "}
          and acknowledge that you understand the{" "}
          <Link href="/" className="text-blue-600 hover:underline">
            Privacy Policy
          </Link>
          .
        </>
      }
      className="sm:px-16"
    >
      <RegisterForm />
    </AuthShell>
  );
}
