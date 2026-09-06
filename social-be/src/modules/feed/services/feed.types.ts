export type FeedPost = {
  id: string;
  content: string;
  createdAt: Date;
  likeCount: number;
  replyCount: number;
  repostCount: number;
  bookmarkCount: number;
  viewCount: number;
  user: {
    id: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type RankedFeedPost = {
  post: FeedPost;
  score: number;
};

export type FeedCursor = {
  v: 1;
  mode: 'ranked' | 'createdAt';
  seed: string;
  rankedAt: number;
  seen: number;
  id: string;
  createdAt: string;
  score?: number;
};
