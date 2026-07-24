import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateRoleData, UpdateRoleData } from "../interfaces/role.interface";
import { RoleService } from "../services/role.service";
import { toast } from "sonner";
import { extractErrMsg } from "@/app/utils/error.util";

export const useRole = (page?: number, limit?: number, all?: boolean) => {
  const qc = useQueryClient();

  const createRole = useMutation({
    mutationFn: async ({ payload }: { payload: CreateRoleData }) => {
      return RoleService.createRole(payload);
    },
    onSuccess: async () => {
      toast.success("Role created successfully");

      await qc.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateRoleData;
    }) => {
      return RoleService.updateRole(id, payload);
    },
    onSuccess: async () => {
      toast.success("Role updated successfully");
      await qc.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  const deleteRoles = useMutation({
    mutationFn: async ({ roleIds }: { roleIds: string[] }) => {
      return RoleService.deleteRoles(roleIds);
    },
    onSuccess: async () => {
      toast.success("Roles deleted");

      await qc.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  const {
    data: roles,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["roles", page, limit],
    queryFn: () => RoleService.findAllRoles(page, limit, all),
    placeholderData: (prev) => prev,
  });

  return {
    roles,
    isLoading,
    isFetching,
    error,
    refetch,

    createRoleMutation: createRole,
    updateRoleMutation,
    deleteRolesMutation: deleteRoles,

    isCreating: createRole.isPending,
    isUpdating: updateRoleMutation.isPending,
    isDeleting: deleteRoles.isPending,
  };
};
