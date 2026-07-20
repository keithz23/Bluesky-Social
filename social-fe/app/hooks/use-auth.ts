import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AuthService } from "../services/auth.service";
import { extractErrMsg } from "../utils/error.util";
import {
  LoginCredentials,
  RegisterData,
  ResetPasswordData,
  UpdateProfileData,
} from "../interfaces/auth.interface";
import type { AuthResponse } from "../interfaces/user.interface";
import { AxiosError } from "axios";
import { useState } from "react";
import { useAuthStore } from "../store/use-auth.store";
import { useRouter } from "next/navigation";
import {
  clearAuthLogoutLock,
  clearAuthSessionCache,
  isAuthLogoutLocked,
  setAuthLogoutLock,
} from "../utils/auth-cache.util";

export function useAuth() {
  const qc = useQueryClient();
  const router = useRouter();
  const [profileUploadProgress, setProfileUploadProgress] = useState<
    number | null
  >(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const applyAuthenticatedSession = async (data: AuthResponse) => {
    clearAuthLogoutLock();
    setAuth(data.accessToken, data.user.username, data.user.email || "");
    qc.setQueryData(["me"], data.user);
    await qc.invalidateQueries({ queryKey: ["me"] });
  };

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        if (isAuthLogoutLocked()) {
          clearAuth();
          return null;
        }

        return await AuthService.me();
      } catch (e: unknown) {
        if (e instanceof AxiosError && e?.response?.status === 401) {
          clearAuth();
          return null;
        }
        throw e;
      }
    },
    retry: false,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });

  const login = useMutation({
    mutationFn: async ({ loginDto }: { loginDto: LoginCredentials }) => {
      return await AuthService.login(loginDto);
    },
    onSuccess: async (data) => {
      if ("requires2FA" in data) {
        toast.success("Verification code sent.");
        return;
      }

      await applyAuthenticatedSession(data);
      toast.success("Glad to have you back.");
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  const verifyLogin2FA = useMutation({
    mutationFn: async (payload: { challengeId: string; otp: string }) => {
      return await AuthService.verifyLogin2FA(payload);
    },
    onSuccess: async (data) => {
      await applyAuthenticatedSession(data);
      toast.success("Glad to have you back.");
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  // 3. Mutation register
  const signup = useMutation({
    mutationFn: async ({ registerDto }: { registerDto: RegisterData }) => {
      return AuthService.register(registerDto);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Your account is ready to go.");
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  // 4. Mutation logout
  const logout = useMutation({
    mutationFn: async () => {
      return AuthService.logout();
    },
    onMutate: async () => {
      setAuthLogoutLock();
      clearAuth();
      await qc.cancelQueries();
    },
    onSettled: async () => {
      await clearAuthSessionCache(qc, clearAuth);
      router.replace("/login");
    },
    onError: async () => {
      await clearAuthSessionCache(qc, clearAuth);
      router.replace("/login");
    },
  });

  // 5. Mutation forgot password
  const forgotPassword = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const res = await AuthService.forgot(email);
      return res;
    },
    onSuccess: (data) => {
      const message =
        data?.message ||
        "If an account with this email exists, a password reset link has been sent.";

      if (data?.canResetPassword === false) {
        toast.warning(message);
        return;
      }

      toast.success(message);
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  // 6. Mutation reset password
  const resetPassword = useMutation({
    mutationFn: async ({
      resetPasswordData,
    }: {
      resetPasswordData: ResetPasswordData;
    }) => {
      const res = await AuthService.reset(resetPasswordData);
      return res;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Password reset successful.");
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  const updateProfile = useMutation({
    mutationFn: async ({
      updateProfileData,
    }: {
      updateProfileData: UpdateProfileData;
    }) => {
      const hasUpload = Boolean(
        updateProfileData.avatarFile || updateProfileData.coverFile,
      );
      setProfileUploadProgress(hasUpload ? 0 : null);
      const res = await AuthService.updateProfile(updateProfileData, (event) => {
        if (!event.total) return;
        setProfileUploadProgress(
          Math.min(99, Math.round((event.loaded / event.total) * 100)),
        );
      });
      setProfileUploadProgress(hasUpload ? 100 : null);
      return res;
    },

    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["me"] });
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully");
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
    onSettled: () => {
      setProfileUploadProgress(null);
    },
  });

  return {
    // User Info
    user: meQuery.data,
    isLoadingProfile: meQuery.isLoading,
    isAuthenticated: !!meQuery.data,
    refetchMe: meQuery.refetch,

    loginMutation: login,
    verifyLogin2FAMutation: verifyLogin2FA,
    signupMutation: signup,
    logoutMutation: logout,
    updateProfileMutation: updateProfile,
    profileUploadProgress,
    forgotPasswordMutation: forgotPassword,
    resetPasswordMutation: resetPassword,

    isLoggingIn: login.isPending,
    isVerifyingLogin2FA: verifyLogin2FA.isPending,
    isRegistering: signup.isPending,
    isLoggingOut: logout.isPending,
    isUpdating: updateProfile.isPending,
    isResettingPassword: resetPassword.isPending,
    isForgotPassword: forgotPassword.isPending,

    loginError: login.error,
    verifyLogin2FAError: verifyLogin2FA.error,
    registerError: signup.error,
    logoutError: logout.error,
    updateProfileErorr: updateProfile.error,
    forgotPasswordError: forgotPassword.error,
    resetPasswordError: resetPassword.error,
    resetPasswordSuccess: resetPassword.isSuccess,
  };
}
