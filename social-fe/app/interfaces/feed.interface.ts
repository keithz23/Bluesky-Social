import { PostMedia } from "./post.interface";
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
  replyFollowers?: string;
  replyFollowing?: string;
  replyMentioned?: string;
  userId: string;
  user: User;
  media: PostMedia[];
  createdAt?: Date;
  rootPost?: Feed;
  post?: any;
}
