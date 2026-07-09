export const QUEUE_NAMES = {
  IMAGE_PROCESSING: 'image-processing',
  CLEANUP: 'cleanup',
  FEED_FANOUT: 'feed-fanout',
} as const;

export const JOB_NAMES = {
  // Image processing jobs
  UPLOAD_IMAGES: 'upload-images',
  RESIZE_IMAGE: 'resize-image',
  GENERATE_THUMBNAIL: 'generate-thumbnail',

  // Cleanup jobs
  CLEANUP_FAILED_UPLOAD: 'cleanup-failed-upload',
  CLEANUP_ORPHANED_FILES: 'cleanup-orphaned-files',

  // Feed
  FANOUT_POST: 'fanout-post',
  BACKFILL_USER_FEED: 'backfill-user-feed',
  CLEANUP_AUTHOR_FEED: 'cleanup-author-feed',
} as const;

// Job data interfaces
export interface UploadImagesJobData {
  files: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  }[];
  folder: string;
  postId?: string;
  userId: string;
  options?: {
    resize?: boolean;
    quality?: number;
  };
}

export interface CleanupJobData {
  keys: string[];
  reason:
    | 'transaction_failed'
    | 'post_deleted'
    | 'orphaned'
    | 'replaced_by_new_upload'
    | 'db_update_failed'
    | 'list_deleted';
  retryCount?: number;
}

export interface ResizeImageJobData {
  key: string;
  bucket: string;
  sizes: {
    width: number;
    height: number;
    suffix: string;
  }[];
}

export interface FanoutPostJobData {
  postId: string;
  authorId: string;
}

export interface BackfillUserFeedJobData {
  followerId: string;
  followingId: string;
}

export interface CleanupAuthorFeedJobData {
  userId: string;
  authorId: string;
}
