import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateRoleData, UpdateRoleData } from "../interfaces/role.interface";
import { RoleService } from "../services/role.service";
import { toast } from "sonner";
import { extractErrMsg } from "@/app/utils/error.util";

export const useRole = () => {
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

  const updateRole = useMutation({
    mutationFn: async ({ payload }: { payload: UpdateRoleData }) => {
      return RoleService.updateRole(payload.roleId, payload);
    },
    onSuccess: async () => {
      toast.success("Role updated successfully");
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  return {
    createRoleMutation: createRole,
    updateRoleMutation: updateRole,

    isCreating: createRole.isPending,
    isUpdating: updateRole.isPending,
  };
};
