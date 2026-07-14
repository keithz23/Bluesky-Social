import { PostMedia, PostTheme } from "./post.interface";
import { User } from "./user.interface";

export interface Feed {
  id: string;
  content: string;
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
  userId: string;
  user: User;
  media: PostMedia[];
  postTheme?: PostTheme | null;
  createdAt?: Date;
  updatedAt?: Date;
  parentPostId?: string;
  rootPostId?: string | null;
  rootPost?: Feed;
  parentChain?: Feed[];
  post?: any;
}
