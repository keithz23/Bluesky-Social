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

export function useAuth() {
  const qc = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        const { data } = await AuthService.me();
        return data;
      } catch (e: unknown) {
        if (e instanceof AxiosError && e?.response?.status === 401) {
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
      return await AuthService.login(loginDto)
    },
    onSuccess: async (data) => {
      setAuth(data.accessToken, data.user.username, data.user.email || '')
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
    onSuccess: () => {
      clearAuth();
      qc.setQueryData(["me"], null);
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  // 5. Mutation forgot password
  const forgotPassword = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      return AuthService.forgot(email);
    },
    onSuccess: () => {
      toast.success("Password reset email sent.");
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
      return AuthService.reset(resetPasswordData);
    },
    onSuccess: () => {
      toast.success("Password reset successful.");
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
      return AuthService.updateProfile(updateProfileData);
    },

    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["me"] });
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully");
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
