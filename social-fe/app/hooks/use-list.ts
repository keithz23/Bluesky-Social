import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { CreateListData } from "../interfaces/list.interface";
import { ListService } from "../services/list.service";
import { toast } from "sonner";
import { extractErrMsg } from "../utils/error.util";

export const useLists = () => {
  const qc = useQueryClient();

  const createList = useMutation({
    mutationFn: async ({ payload }: { payload: CreateListData }) => {
      console.log(payload);
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

  return {
    createListMutation: createList,

    isCreating: createList.isPending,
  };
};

export const useGetlists = () => {
  return useInfiniteQuery({
    queryKey: ["lists"],
    queryFn: ({ pageParam }) => ListService.getLists(pageParam),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
  });
};
