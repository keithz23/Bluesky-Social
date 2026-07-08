export const IMAGE_UPLOAD_RULES = {
  maxPostImages: 4,
  maxImageSizeBytes: 10 * 1024 * 1024,
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp"],
  accept: "image/jpeg,image/png,image/webp",
} as const;

export const formatFileSize = (bytes: number) =>
  `${Math.round((bytes / 1024 / 1024) * 10) / 10}MB`;

export const validateImageFile = (file: File): string | null => {
  if (
    !(IMAGE_UPLOAD_RULES.allowedImageTypes as readonly string[]).includes(
      file.type,
    )
  ) {
    return "Only JPG, PNG, and WEBP images are allowed.";
  }

  if (file.size > IMAGE_UPLOAD_RULES.maxImageSizeBytes) {
    return `Image is too large. Maximum size is ${formatFileSize(
      IMAGE_UPLOAD_RULES.maxImageSizeBytes,
    )}.`;
  }

  return null;
};
