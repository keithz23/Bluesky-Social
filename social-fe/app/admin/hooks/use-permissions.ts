import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PermissionService } from "../services/permission.service";
import { toast } from "sonner";
import { extractErrMsg } from "@/app/utils/error.util";

export const usePermissions = () => {
  const qc = useQueryClient();

  const {
    data: permissionGroup,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["permissions-group"],
    queryFn: () => PermissionService.findAllPermissionGroup(),
  });

  const assignPermissionsMutation = useMutation({
    mutationFn: async ({
      roleId,
      permissionIds,
    }: {
      roleId: string;
      permissionIds: string[];
    }) => {
      return PermissionService.assignPermissions(roleId, permissionIds);
    },
    onSuccess: async () => {
      toast.success("Permission updated");
      qc.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  const syncPermissionsMutation = useMutation({
    mutationFn: async ({
      roleId,
      permissionIds,
    }: {
      roleId: string;
      permissionIds: string[];
    }) => {
      return PermissionService.syncPermissions(roleId, permissionIds);
    },
    onSuccess: async () => {
      toast.success("Permission updated");
      qc.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  const revokePermissionMutation = useMutation({
    mutationFn: async ({
      roleId,
      permissionId,
    }: {
      roleId: string;
      permissionId: string;
    }) => {
      return PermissionService.revokePermission(roleId, permissionId);
    },
    onSuccess: async () => {
      toast.success("Permission updated");
      qc.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  return {
    permissionGroup,
    permissionGroupLoading: isLoading,
    permissionGroupFetching: isFetching,
    permissionGroupError: error,
    permissionGroupRefetch: refetch,

    assignPermissionsMutation,
    isAssigning: assignPermissionsMutation.isPending,

    revokePermissionMutation,
    isRevoking: revokePermissionMutation.isPending,

    syncPermissionsMutation,
    isSyncing: syncPermissionsMutation.isPending,
  };
};
