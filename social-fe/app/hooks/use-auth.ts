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
import { AxiosError } from "axios";
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
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);

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
      clearAuthLogoutLock();
      setAuth(data.accessToken, data.user.username, data.user.email || "");
      qc.setQueryData(["me"], data.user);
      await qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Glad to have you back.");
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  // 3. Mutation register
  const signup = useMutation({
    mutationFn: async ({ registerDto }: { registerDto: RegisterData }) => {
      const res = await AuthService.register(registerDto);
      return res.data;
    },
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: ["me"] });
      toast.success(data?.message || "Your account is ready to go.");
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
      return res.data;
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
      return res.data;
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
      const res = await AuthService.updateProfile(updateProfileData);
      return res.data
    },

    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: ["me"] });
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success(data?.message || "Profile updated successfully");
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  return {
    // User Info
    user: meQuery.data,
    isLoadingProfile: meQuery.isLoading,
    isAuthenticated: !!meQuery.data,
    refetchMe: meQuery.refetch,

    loginMutation: login,
    signupMutation: signup,
    logoutMutation: logout,
    updateProfileMutation: updateProfile,
    forgotPasswordMutation: forgotPassword,
    resetPasswordMutation: resetPassword,

    isLoggingIn: login.isPending,
    isRegistering: signup.isPending,
    isLoggingOut: logout.isPending,
    isUpdating: updateProfile.isPending,
    isResettingPassword: resetPassword.isPending,
    isForgotPassword: forgotPassword.isPending,

    loginError: login.error,
    registerError: signup.error,
    logoutError: logout.error,
    updateProfileErorr: updateProfile.error,
    forgotPasswordError: forgotPassword.error,
    resetPasswordError: resetPassword.error,
    resetPasswordSuccess: resetPassword.isSuccess,
  };
}
