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
  onRequestDeleteCodeSuccess?: () => void;
  onRequestEnable2FACodeSuccess?: () => void;
  onRequestDisable2FACodeSuccess?: () => void;
  onEnable2FASuccess?: (data: { recoveryCodes?: string[] }) => void;
  onRequestTOTPSetupSuccess?: (data: {
    secret: string;
    qrCodeDataUrl: string;
  }) => void;
  onEnableTOTPSuccess?: (data: { recoveryCodes?: string[] }) => void;
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

  const requestDeleteAccountMutation = useMutation({
    mutationFn: () => AuthService.requestDeleteAccount(),
    onSuccess: () => {
      options?.onRequestDeleteCodeSuccess?.();
      toast.success("Verification code sent.");
    },
    onError: (err) => toast.error(extractErrMsg(err)),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (payload: { otp: string }) => AuthService.deleteAccount(payload),
    onSuccess: async () => {
      await resetAuth();
      options?.onSuccess?.();
      toast.success("Account deleted.");
      router.push("/login");
    },
    onError: (err) => toast.error(extractErrMsg(err)),
  });

  const requestEnable2FAMutation = useMutation({
    mutationFn: (payload: { password: string }) =>
      AuthService.requestEnable2FA(payload),
    onSuccess: (response) => {
      toast.success("Authenticator setup ready.");
      options?.onRequestEnable2FACodeSuccess?.();
      options?.onRequestTOTPSetupSuccess?.(response.data);
    },
    onError: (err) => toast.error(extractErrMsg(err)),
  });

  const enable2FAMutation = useMutation({
    mutationFn: (payload: { otp: string }) => AuthService.enable2FA(payload),
    onSuccess: async (response) => {
      await qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Two-factor authentication enabled.");
      options?.onSuccess?.();
      options?.onEnable2FASuccess?.(response.data);
      options?.onEnableTOTPSuccess?.(response.data);
    },
    onError: (err) => toast.error(extractErrMsg(err)),
  });

  const requestTOTPSetupMutation = requestEnable2FAMutation;
  const enableTOTPMutation = enable2FAMutation;

  const requestDisable2FAMutation = useMutation({
    mutationFn: () => AuthService.requestDisable2FA(),
    onSuccess: () => {
      toast.success("Verification code sent.");
      options?.onRequestDisable2FACodeSuccess?.();
    },
    onError: (err) => toast.error(extractErrMsg(err)),
  });

  const disable2FAMutation = useMutation({
    mutationFn: (payload: { password?: string; otp: string }) =>
      AuthService.disable2FA(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Two-factor authentication disabled.");
      options?.onSuccess?.();
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
    requestDeleteAccountMutation,
    deleteAccountMutation,
    requestEnable2FAMutation,
    enable2FAMutation,
    requestTOTPSetupMutation,
    enableTOTPMutation,
    requestDisable2FAMutation,
    disable2FAMutation,

    isRequestingEmailCode: requestUpdateEmailMutation.isPending,
    isUpdatingEmail: updateEmailMutation.isPending,
    isRequestingPasswordCode: requestUpdatePasswordMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,
    isChangingUsername: changeUsernameMutation.isPending,
    isChangingBirthday: changeBirthDayMutation.isPending,
    isRequestingDeactivateCode: requestDeactivateAccountMutation.isPending,
    isDeactivatingAccount: deactivateAccountMutation.isPending,
    isRequestingDeleteCode: requestDeleteAccountMutation.isPending,
    isDeletingAccount: deleteAccountMutation.isPending,
    isRequestingEnable2FA: requestEnable2FAMutation.isPending,
    isEnable2FA: enable2FAMutation.isPending,
    isRequestingTOTPSetup: requestTOTPSetupMutation.isPending,
    isEnablingTOTP: enableTOTPMutation.isPending,
    isRequestingDisable2FA: requestDisable2FAMutation.isPending,
    isDisabling2FA: disable2FAMutation.isPending,
  };
};
