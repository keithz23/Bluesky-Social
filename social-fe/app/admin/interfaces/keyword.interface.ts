import type { ApiEnvelope, KeywordResponse, PaginationMeta } from "@social/api-contracts";

export type {
  CreateKeywordRequest as CreateKeywordData,
  KeywordAction,
  KeywordResponse as Keyword,
  UpdateKeywordRequest as UpdateKeywordData,
} from "@social/api-contracts";

export type { PaginationMeta };
export type KeywordsResponse = ApiEnvelope<KeywordResponse[]>;
