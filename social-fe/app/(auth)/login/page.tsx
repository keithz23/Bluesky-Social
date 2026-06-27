"use client";

import AuthShell from "@/app/components/auth/auth-shell";
import LoginForm from "@/app/components/auth/login-form";
import { VerifyToast } from "@/app/components/verify-toast";
import Link from "next/link";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <>
      <AuthShell
        title="Log In"
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
      >
        <LoginForm />
      </AuthShell>

      <Suspense fallback={null}>
        <VerifyToast />
      </Suspense>
    </>
  );
}
