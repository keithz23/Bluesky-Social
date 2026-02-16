import AuthBanner from "@/app/components/auth/auth-banner";
import Link from "next/link";

export default function PasswordUpdatedPage() {
  return (
    <>
      <div className="min-h-screen grid grid-cols-1 md:grid-cols-3">
        <div className="col-span-1 flex flex-col justify-center items-end bg-[#f9fafb]">
          <AuthBanner
            title="Password Updated"
            description="You can now sign in with your new password"
          />
        </div>
        <div className="col-span-2 flex flex-col justify-center items-center px-12 space-y-4">
          <p className="text-2xl text-gray-900 font-bold">Password updated!</p>
          <span className="text-sm text-gray-700">
            You can now sign in with your new password.
          </span>

          <Link href={"/login"}>
            <button className="px-8 py-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm cursor-pointer">
              Okay
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}
