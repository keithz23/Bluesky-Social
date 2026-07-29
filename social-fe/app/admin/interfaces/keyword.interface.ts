import { Rule } from "./rule.interface";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type KeywordAction = "FLAG" | "AUTO_HIDE" | "WARN";

export interface Keyword {
  id: string;
  word: string;
  ruleId: string;
  action: string;
  createdAt: string;
  updatedAt: string;
  rule: Rule;
}

export interface CreateKeywordData {
  word: string;
  ruleId: string;
  action: KeywordAction;
}

export interface KeywordsResponse {
  message: string;
  data: Rule[];
  meta: PaginationMeta;
  timestamp?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateKeywordData extends Partial<CreateKeywordData> {}
