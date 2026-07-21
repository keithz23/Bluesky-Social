import { ImagePreview } from "@/app/interfaces/dialog/dialog.interface";
import { PostMedia } from "@/app/interfaces/post.interface";
import { X } from "lucide-react";

type EditPostMediaPreviewProps = {
  keptImages: PostMedia[];
  selectedImages: ImagePreview[];
  gifPreview: string | null;
  imageCount: number;
  maxImageCount: number;
  onRemoveExistingMedia: (mediaId: string) => void;
  onRemoveSelectedImage: (index: number) => void;
  onClearGif: () => void;
};

const getGridClass = (count: number) => {
  if (count === 1) return "grid-cols-1";
  return "grid-cols-2";
};

export function EditPostMediaPreview({
  keptImages,
  selectedImages,
  gifPreview,
  imageCount,
  maxImageCount,
  onRemoveExistingMedia,
  onRemoveSelectedImage,
  onClearGif,
}: EditPostMediaPreviewProps) {
  const hasImages = imageCount > 0;
  const hasGif = Boolean(gifPreview);

  return (
    <>
      {hasImages && (
        <div className="min-w-0 px-4 pb-3">
          <div className={`grid ${getGridClass(imageCount)} gap-2`}>
            {keptImages.map((media, index) => {
              const isThreeFirst = imageCount === 3 && index === 0;
              return (
                <div
                  key={media.id}
                  className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 ${
                    isThreeFirst ? "col-span-2" : ""
                  }`}
                >
                  <img
                    src={media.mediaUrl}
                    alt={media.altText ?? `Selected media ${index + 1}`}
                    className={`w-full object-cover ${
                      isThreeFirst ? "max-h-56" : "max-h-48"
                    }`}
                  />
                  <button
                    onClick={() => onRemoveExistingMedia(media.id)}
                    className="absolute top-2 right-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-slate-950/65 text-white transition hover:bg-slate-950"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}

            {selectedImages.map((image, index) => {
              const mediaIndex = keptImages.length + index;
              const isThreeFirst = imageCount === 3 && mediaIndex === 0;
              return (
                <div
                  key={image.preview}
                  className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 ${
                    isThreeFirst ? "col-span-2" : ""
                  }`}
                >
                  <img
                    src={image.preview}
                    alt={`Selected media ${mediaIndex + 1}`}
                    className={`w-full object-cover ${
                      isThreeFirst ? "max-h-56" : "max-h-48"
                    }`}
                  />
                  <button
                    onClick={() => onRemoveSelectedImage(index)}
                    className="absolute top-2 right-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-slate-950/65 text-white transition hover:bg-slate-950"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
          {imageCount < maxImageCount && (
            <p className="mt-2 text-xs text-slate-400">
              {imageCount}/{maxImageCount} images -{" "}
              {maxImageCount - imageCount} remaining
            </p>
          )}
        </div>
      )}

      {hasGif && gifPreview && (
        <div className="relative inline-block max-w-[calc(100%-4.5rem)] px-4 pb-3">
          <img
            src={gifPreview}
            alt="Selected GIF"
            className="max-h-72 max-w-full rounded-2xl border border-slate-200 object-cover"
          />
          <button
            onClick={onClearGif}
            className="absolute top-2 right-6 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-slate-950/65 text-white transition hover:bg-slate-950"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
