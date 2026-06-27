import AuthShell from "@/app/components/auth/auth-shell";
import ForgotForm from "@/app/components/auth/forgot-form";

export default function ForgotPage() {
  return (
    <AuthShell
      title="Reset Password"
      description="Enter your account email and we will send you a reset code."
    >
      <ForgotForm />
    </AuthShell>
  );
}
