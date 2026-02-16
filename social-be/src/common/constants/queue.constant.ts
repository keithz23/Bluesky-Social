export const QUEUE_NAMES = {
  IMAGE_PROCESSING: 'image-processing',
  CLEANUP: 'cleanup',
} as const;

export const JOB_NAMES = {
  // Image processing jobs
  UPLOAD_IMAGES: 'upload-images',
  RESIZE_IMAGE: 'resize-image',
  GENERATE_THUMBNAIL: 'generate-thumbnail',

  // Cleanup jobs
  CLEANUP_FAILED_UPLOAD: 'cleanup-failed-upload',
  CLEANUP_ORPHANED_FILES: 'cleanup-orphaned-files',
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
  reason: 'transaction_failed' | 'post_deleted' | 'orphaned';
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
