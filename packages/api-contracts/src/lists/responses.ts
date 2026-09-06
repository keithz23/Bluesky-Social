import type { IsoDateTimeString } from "../common/api-envelope";
import type { PostResponse } from "../posts/responses";
import type { UserSummaryResponse } from "../users/responses";

export interface ListResponse {
  id: string;
  name: string;
  description: string;
  listPhoto: string;
  createdAt?: IsoDateTimeString;
  userId?: string;
  user: UserSummaryResponse;
  posts?: PostResponse[];
}

export interface ListsPageResponse {
  lists: ListResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ListMemberResponse {
  id: string;
  listId: string;
  addedAt: IsoDateTimeString;
  user: UserSummaryResponse;
}

export interface ListMembersPageResponse {
  members: ListMemberResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}
