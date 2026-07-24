import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserService } from "../services/user.service";
import { CreateUserData, UpdateUserData } from "../interfaces/user.interface";
import { toast } from "sonner";
import { extractErrMsg } from "@/app/utils/error.util";

export const useUser = (page?: number, limit?: number) => {
  const qc = useQueryClient();

  const {
    data: userData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["users", page, limit],
    queryFn: () => UserService.findAll(page, limit),
    placeholderData: (prev) => prev,
  });

  const createUserMutation = useMutation({
    mutationFn: async ({ payload }: { payload: CreateUserData }) => {
      return UserService.create(payload);
    },
    onSuccess: async () => {
      toast.success("User created successfully");

      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateUserData;
    }) => {
      return UserService.update(id, payload);
    },
    onSuccess: async () => {
      toast.success("User updated");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  const deleteUsersMutation = useMutation({
    mutationFn: async ({ userIds }: { userIds: string[] }) => {
      return UserService.delete(userIds);
    },
    onSuccess: async () => {
      toast.success("Users deleted");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  return {
    userData,
    isUserLoading: isLoading,
    isUserFetching: isFetching,
    userError: error,
    userRefetch: refetch,

    createUserMutation,
    updateUserMutation,
    deleteUsersMutation,

    isCreating: createUserMutation.isPending,
    isUpdating: updateUserMutation.isPending,
    isDeleting: deleteUsersMutation.isPending,
  };
};
