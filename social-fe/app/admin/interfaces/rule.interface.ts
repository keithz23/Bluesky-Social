import type { ApiEnvelope, PaginationMeta, RuleResponse } from "@social/api-contracts";

export type {
  CreateRuleRequest as CreateRulePayload,
  RuleResponse as Rule,
  RuleSeverity,
  UpdateRuleRequest as UpdateRulePayload,
} from "@social/api-contracts";

export type { PaginationMeta };
export type RuleListResponse = ApiEnvelope<RuleResponse[]>;
