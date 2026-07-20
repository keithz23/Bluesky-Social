import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { ListMemberService } from "../services/list-member.service";
import { toast } from "sonner";
import { extractErrMsg } from "../utils/error.util";
import { infiniteQueryOptions } from "./infinite-query-options";

type ListMembersResponse = Awaited<
  ReturnType<typeof ListMemberService.getMemberList>
>;

export const useListMember = () => {
  const qc = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async ({
      listId,
      userIdToAdd,
    }: {
      listId: string;
      userIdToAdd: string;
    }) => {
      return ListMemberService.addMember(listId, userIdToAdd);
    },
    onSuccess: async (_, variables) => {
      toast.success("User added to list successfully");
      await Promise.all([
        qc.invalidateQueries({
          queryKey: ["list-member", variables.listId],
        }),
        qc.invalidateQueries({
          queryKey: ["list-detail", variables.listId],
        }),
        qc.invalidateQueries({
          queryKey: ["lists"],
        }),
        qc.invalidateQueries({
          queryKey: ["users", "search"],
        }),
      ]);
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  const removeMutation = useMutation({
    mutationFn: async ({
      listId,
      userIdToRemove,
    }: {
      listId: string;
      userIdToRemove: string;
    }) => {
      return ListMemberService.removeMember(listId, userIdToRemove);
    },
    onSuccess: async (_, variables) => {
      toast.success("User removed from list successfully");
      await Promise.all([
        qc.invalidateQueries({
          queryKey: ["list-member", variables.listId],
        }),
        qc.invalidateQueries({
          queryKey: ["list-detail", variables.listId],
        }),
        qc.invalidateQueries({
          queryKey: ["lists"],
        }),
        qc.invalidateQueries({
          queryKey: ["users", "search"],
        }),
      ]);
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  return {
    mutationAdd: addMutation,
    mutationRemove: removeMutation,
    isAddingMember: addMutation.isPending,
    isRemovingMember: removeMutation.isPending,
  };
};

export const useGetListMembers = (listId: string) => {
  return useInfiniteQuery<
    ListMembersResponse,
    Error,
    InfiniteData<ListMembersResponse>,
    [string, string],
    string | undefined
  >({
    queryKey: ["list-member", listId],

    queryFn: ({ pageParam }) =>
      ListMemberService.getMemberList(
        listId,
        pageParam as string | undefined,
      ),

    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: !!listId,
    ...infiniteQueryOptions,
  });
};
