import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { CreateListData, UpdateList } from "../interfaces/list.interface";
import { ListService } from "../services/list.service";
import { toast } from "sonner";
import { extractErrMsg } from "../utils/error.util";
import { infiniteQueryOptions } from "./infinite-query-options";

export const useLists = () => {
  const qc = useQueryClient();

  const createList = useMutation({
    mutationFn: async ({ payload }: { payload: CreateListData }) => {
      return ListService.createList(payload);
    },
    onSuccess: async () => {
      toast.success("List created successfully");

      await qc.invalidateQueries({
        queryKey: ["lists"],
      });
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  const updateList = useMutation({
    mutationFn: async ({ payload }: { payload: UpdateList }) => {
      return ListService.updateList(payload);
    },
    onSuccess: async () => {
      toast.success("List updated successfully");
      await qc.invalidateQueries({
        queryKey: ["list-detail"],
      });
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  const deleteList = useMutation({
    mutationFn: async (id: string) => {
      return ListService.deleteList(id);
    },
    onSuccess: async () => {
      toast.success("List deleted successfully");
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  return {
    createListMutation: createList,
    updateListMutation: updateList,
    deleteMutation: deleteList,

    isCreating: createList.isPending,
    isUpdating: updateList.isPending,
    isDeleting: deleteList.isPending,
  };
};

export const useGetlists = (username?: string) => {
  return useInfiniteQuery({
    queryKey: ["lists", username ?? "me"],
    queryFn: ({ pageParam }) =>
      ListService.getLists(pageParam, undefined, username),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    ...infiniteQueryOptions,
  });
};

export const useGetListById = (id: string) => {
  return useQuery({
    queryKey: ["list-detail", id],
    queryFn: () => ListService.getListById(id),
    enabled: !!id,
  });
};
