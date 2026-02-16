import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AuthService } from "../services/auth.service";
import { extractErrMsg } from "../utils/error.util";
import { LoginCredentials, RegisterData } from "../interfaces/auth.interface";

export function useAuth() {
  const qc = useQueryClient();

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        const { data } = await AuthService.me();
        return data;
      } catch (e: any) {
        if (e?.response?.status === 401) {
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
      return AuthService.login(loginDto);
    },
    onSuccess: async () => {
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
      qc.setQueryData(["me"], null);
      toast.success("Đã đăng xuất.");
      window.location.href = "/login";
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

    isLoggingIn: login.isPending,
    isRegistering: signup.isPending,

    loginError: login.error,
    registerError: signup.error,
  };
}
