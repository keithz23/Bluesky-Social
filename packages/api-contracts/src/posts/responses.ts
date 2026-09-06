import type { IsoDateTimeString } from "../common/api-envelope";
import type { UserSummaryResponse } from "../users/responses";

export interface PostThemeResponse {
  type: string;
  background: string;
}

export interface PostMediaResponse {
  id: string;
  mediaUrl: string;
  mediaType: string;
  width?: number | null;
  height?: number | null;
  altText: string | null;
}

export interface PostResponse {
  id: string;
  content: string;
  createdAt: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
  likeCount: number;
  replyCount: number;
  repostCount: number;
  bookmarkCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  isReposted: boolean;
  replyPolicy?: string;
  replyFollowers?: boolean;
  replyFollowing?: boolean;
  replyMentioned?: boolean;
  allowQuote?: boolean;
  userId?: string;
  user: UserSummaryResponse;
  media: PostMediaResponse[];
  postTheme?: PostThemeResponse | null;
  parentPostId?: string | null;
  rootPostId?: string | null;
  rootPost?: PostResponse;
  parentChain?: PostResponse[];
  isPinned: boolean;
  autoFlagged?: boolean;
  isDeleted?: boolean;
  post?: unknown;
}

export interface PostsPageResponse {
  posts: PostResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface RepliesPageResponse {
  replies: PostResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CreatePostResponse {
  message: string;
  post: PostResponse;
}

export interface LikeActionResponse {
  liked: boolean;
}

export interface BookmarkActionResponse {
  bookmarked: boolean;
}

export interface RepostActionResponse {
  reposted: boolean;
}
