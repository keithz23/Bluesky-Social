"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthService } from "../services/auth.service";
import { toast } from "sonner";
import { extractErrMsg } from "../utils/error.util";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/use-auth.store";
import { clearAuthSessionCache } from "../utils/auth-cache.util";

type useAccountSettingsOptions = {
  onSuccess?: () => void;
  onRequestEmailCodeSuccess?: () => void;
  onRequestPasswordCodeSuccess?: () => void;
  onRequestDeactivateCodeSuccess?: () => void;
};

export const useAccountSettings = (options?: useAccountSettingsOptions) => {
  const router = useRouter();
  const qc = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const resetAuth = async () => {
    await clearAuthSessionCache(qc, clearAuth);
  };

  const requestUpdateEmailMutation = useMutation({
    mutationFn: (payload: { newEmail: string }) =>
      AuthService.requestUpdateEmail(payload),
    onSuccess: () => {
      options?.onRequestEmailCodeSuccess?.();
      toast.success("Verification code sent.");
    },
    onError: (err) => toast.error(extractErrMsg(err)),
  });

  const updateEmailMutation = useMutation({
    mutationFn: (payload: { otp: string }) => AuthService.updateEmail(payload),
    onSuccess: async () => {
      await resetAuth();
      options?.onSuccess?.();
      toast.success("Email updated. Please login again.");
      router.push("/login");
    },
    onError: (err) => toast.error(extractErrMsg(err)),
  });

  const requestUpdatePasswordMutation = useMutation({
    mutationFn: () => AuthService.requestUpdatePassword(),
    onSuccess: () => {
      options?.onRequestPasswordCodeSuccess?.();
      toast.success("Verification code sent.");
    },
    onError: (err) => toast.error(extractErrMsg(err)),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (payload: { otp: string; newPassword: string }) =>
      AuthService.changePassword(payload),
    onSuccess: async () => {
      await resetAuth();
      options?.onSuccess?.();
      toast.success("Password changed. Please login again.");
      router.push("/login");
    },
    onError: (err) => toast.error(extractErrMsg(err)),
  });

  const changeUsernameMutation = useMutation({
    mutationFn: (payload: { username: string }) =>
      AuthService.changeUsername(payload),
    onSuccess: async () => {
      qc.setQueryData(["me"], null);
      await qc.invalidateQueries({ queryKey: ["me"] });

      options?.onSuccess?.();
      toast.success("Username changed.");
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  const changeBirthDayMutation = useMutation({
    mutationFn: (payload: { dateOfBirth: string }) =>
      AuthService.changeBirthDay(payload),
    onSuccess: async () => {
      qc.setQueryData(["me"], null);
      await qc.invalidateQueries({ queryKey: ["me"] });
      options?.onSuccess?.();
      toast.success("Birthday changed.");
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  const requestDeactivateAccountMutation = useMutation({
    mutationFn: () => AuthService.requestDeactivateAccount(),
    onSuccess: () => {
      options?.onRequestDeactivateCodeSuccess?.();
      toast.success("Verification code sent.");
    },
    onError: (err) => toast.error(extractErrMsg(err)),
  });

  const deactivateAccountMutation = useMutation({
    mutationFn: (payload: { otp: string }) =>
      AuthService.deactivateAccount(payload),
    onSuccess: async () => {
      await resetAuth();
      options?.onSuccess?.();
      toast.success("Account deactivated.");
      router.push("/login");
    },
    onError: (err) => toast.error(extractErrMsg(err)),
  });

  return {
    requestUpdateEmailMutation,
    updateEmailMutation,
    requestUpdatePasswordMutation,
    changePasswordMutation,
    changeUsernameMutation,
    changeBirthDayMutation,
    requestDeactivateAccountMutation,
    deactivateAccountMutation,

    isRequestingEmailCode: requestUpdateEmailMutation.isPending,
    isUpdatingEmail: updateEmailMutation.isPending,
    isRequestingPasswordCode: requestUpdatePasswordMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,
    isChangingUsername: changeUsernameMutation.isPending,
    isChangingBirthday: changeBirthDayMutation.isPending,
    isRequestingDeactivateCode: requestDeactivateAccountMutation.isPending,
    isDeactivatingAccount: deactivateAccountMutation.isPending,
  };
};
