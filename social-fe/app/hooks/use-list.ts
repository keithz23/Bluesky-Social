import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { CreateListData, List, UpdateList } from "../interfaces/list.interface";
import { ListService } from "../services/list.service";
import { toast } from "sonner";
import { extractErrMsg } from "../utils/error.util";
import { infiniteQueryOptions } from "./infinite-query-options";

type ListsResponse = {
  lists: List[];
  nextCursor: string | null;
  hasMore: boolean;
};

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
  return useInfiniteQuery<
    ListsResponse,
    Error,
    InfiniteData<ListsResponse>,
    [string, string],
    string | undefined
  >({
    queryKey: ["lists", username ?? "me"],
    queryFn: ({ pageParam }): Promise<ListsResponse> =>
      ListService.getLists(pageParam as string | undefined, undefined, username),
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

export const useListPosts = () => {
  const qc = useQueryClient();

  const addPost = useMutation({
    mutationFn: async ({
      listId,
      postId,
    }: {
      listId: string;
      postId: string;
    }) => {
      return ListService.addPostToList(listId, postId);
    },
    onSuccess: async (_, variables) => {
      toast.success("Post added to list");
      await qc.invalidateQueries({
        queryKey: ["list-detail", variables.listId],
      });
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  const removePost = useMutation({
    mutationFn: async ({
      listId,
      postId,
    }: {
      listId: string;
      postId: string;
    }) => {
      return ListService.removePostFromList(listId, postId);
    },
    onSuccess: async (_, variables) => {
      toast.success("Post removed from list");
      await qc.invalidateQueries({
        queryKey: ["list-detail", variables.listId],
      });
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  return {
    addPostMutation: addPost,
    removePostMutation: removePost,
    isAddingPost: addPost.isPending,
    isRemovingPost: removePost.isPending,
  };
};
