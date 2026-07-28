import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeywordsService } from "../services/keywords.service";
import {
  CreateKeywordData,
  UpdateKeywordData,
} from "../interfaces/keyword.interface";
import { toast } from "sonner";
import { extractErrMsg } from "@/app/utils/error.util";

export const useKeywordsMutation = () => {
  const qc = useQueryClient();

  const createKeywordMutation = useMutation({
    mutationFn: async ({ payload }: { payload: CreateKeywordData }) => {
      return KeywordsService.create(payload);
    },
    onSuccess: async () => {
      toast.success("Keyword created successfully");

      await qc.invalidateQueries({ queryKey: ["keywords"] });
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  const updateKeywordMutation = useMutation({
    mutationFn: async ({
      keywordId,
      payload,
    }: {
      keywordId: string;
      payload: UpdateKeywordData;
    }) => {
      return KeywordsService.update(keywordId, payload);
    },
    onSuccess: async () => {
      toast.success("Keyword updated successfully");

      await qc.invalidateQueries({ queryKey: ["keywords"] });
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  const deleteKeywordsMutation = useMutation({
    mutationFn: async ({ keywordIds }: { keywordIds: string[] }) => {
      return KeywordsService.deleteMany(keywordIds);
    },
    onSuccess: async () => {
      toast.success("Keyword(s) deleted successfully");

      await qc.invalidateQueries({ queryKey: ["keywords"] });
    },
    onError: (err) => {
      toast.error(extractErrMsg(err));
    },
  });

  return {
    createKeywordMutation,
    updateKeywordMutation,
    deleteKeywordsMutation,

    isCreating: createKeywordMutation.isPending,
    isUpdating: updateKeywordMutation.isPending,
    isDeleting: deleteKeywordsMutation.isPending,
  };
};

export function useKeywords(
  page: number,
  limit: number,
  search?: string,
  action?: string,
  ruleId?: string,
) {
  const keywordQuery = useQuery({
    queryKey: ["keywords", page, limit, search, action, ruleId],
    queryFn: () => KeywordsService.getAll(page, limit, search, action, ruleId),
  });

  return {
    data: keywordQuery.data,
    isLoading: keywordQuery.isLoading,
    isError: keywordQuery.isError,
  };
}
