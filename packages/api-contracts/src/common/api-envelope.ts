export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiEnvelope<T> {
  statusCode: number;
  message: string;
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
}

export interface CursorPage<T, TKey extends string = "items"> {
  nextCursor: string | null;
  hasMore: boolean;
}

export type IsoDateTimeString = string;
