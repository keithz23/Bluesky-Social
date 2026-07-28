export type RuleSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Rule {
  id: string;
  title: string;
  description: string;
  severity: RuleSeverity;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;

  _count?: {
    reports: number;
    keywords: number;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RuleListResponse {
  message: string;
  data: Rule[];
  meta: PaginationMeta;
  timestamp?: string;
}

export interface CreateRulePayload {
  title: string;
  description: string;
  severity: RuleSeverity;
  isActive: boolean;
  displayOrder: number;
}

export interface UpdateRulePayload extends Partial<CreateRulePayload> {}
