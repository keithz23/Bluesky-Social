import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RulesService } from "@/app/admin/services/rules.service";
import { extractErrMsg } from "@/app/utils/error.util";
import {
  CreateRulePayload,
  UpdateRulePayload,
} from "../interfaces/rule.interface";

export function useActiveRules() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["rules", "active"],
    queryFn: () => RulesService.getActiveRules(),
    staleTime: 5 * 60 * 1000,
  });

  return {
    rules: data ?? [],
    isLoading,
    isError,
  };
}

export function useRuleMutations() {
  const qc = useQueryClient();

  const invalidateRules = () => {
    qc.invalidateQueries({ queryKey: ["rules", "list"] });
    qc.invalidateQueries({ queryKey: ["rules", "active"] });
  };

  const createRuleMutation = useMutation({
    mutationFn: (payload: CreateRulePayload) => RulesService.create(payload),
    onSuccess: () => {
      toast.success("Rule created");
      invalidateRules();
    },
    onError: (error) => toast.error(extractErrMsg(error)),
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({
      ruleId,
      payload,
    }: {
      ruleId: string;
      payload: UpdateRulePayload;
    }) => RulesService.update(ruleId, payload),
    onSuccess: () => {
      toast.success("Rule updated");
      invalidateRules();
    },
    onError: (error) => toast.error(extractErrMsg(error)),
  });

  const deleteRulesMutation = useMutation({
    mutationFn: (ruleIds: string[]) => RulesService.deleteMany(ruleIds),
    onSuccess: () => {
      toast.success("Rule(s) deleted");
      invalidateRules();
    },
    onError: (error) => toast.error(extractErrMsg(error)),
  });

  return {
    createRuleMutation,
    updateRuleMutation,
    deleteRulesMutation,
    isCreating: createRuleMutation.isPending,
    isUpdating: updateRuleMutation.isPending,
    isDeleting: deleteRulesMutation.isPending,
  };
}

export function useRules(
  page: number,
  limit: number,
  search?: string,
  severity?: string,
  status?: string,
  all?: boolean,
) {
  const rulesQuery = useQuery({
    queryKey: ["rules", "list", page, limit, search, severity, status, all],
    queryFn: () =>
      RulesService.getAll(page, limit, search, severity, status, all),
  });

  return {
    data: rulesQuery.data,
    isLoading: rulesQuery.isLoading,
    isError: rulesQuery.isError,
  };
}
