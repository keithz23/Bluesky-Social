export const IMAGE_UPLOAD = {
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  MAX_POST_IMAGES: 4,
  MAX_PROFILE_IMAGES: 2,
} as const;

export const formatUploadSize = (bytes: number) =>
  `${Math.round((bytes / 1024 / 1024) * 10) / 10}MB`;
