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
  user: User;
  media: PostMedia[];
  createdAt?: Date;
  post?: any;
}
