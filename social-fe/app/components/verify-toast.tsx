"use client";
import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export function VerifyToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasShownToast = useRef(false);

  useEffect(() => {
    const status = searchParams.get("status");
    const error = searchParams.get("error");
    const message = searchParams.get("message");

    if (hasShownToast.current) return;
    if (!status && !error) return;

    if (status === "success") {
      toast.success("Verified successfully", {
        description: "Welcome to bluesky social",
      });
      hasShownToast.current = true;
      router.replace("/login", { scroll: false });
    } else if (status === "error") {
      const decodedMsg = decodeURIComponent(message || "");
      const userMsg =
        decodedMsg === "Token_missing"
          ? "Invalid verification link."
          : "Verification failed.";

      toast.error("Error", { description: userMsg });
      hasShownToast.current = true;
      router.replace("/login", { scroll: false });
    } else if (error) {
      // Handle Google login errors
      let userMsg = "An error occurred. Please try again.";

      if (error === "email_exists") {
        userMsg =
          "This email is already registered. Please log in with your password.";
      } else if (error === "google_login_failed") {
        userMsg =
          "This email is already registered. Please log in with your password.";
      }

      toast.error("Login Failed", { description: userMsg });
      hasShownToast.current = true;
      router.replace("/login", { scroll: false });
    }
  }, [searchParams, router]);

  return null;
}
