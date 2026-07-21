import { ImagePreview } from "@/app/interfaces/dialog/dialog.interface";
import { X } from "lucide-react";

type SelectedMediaPreviewProps = {
  selectedImages: ImagePreview[];
  selectedGif: string | null;
  maxImageCount: number;
  onRemoveImage: (index: number) => void;
  onRemoveGif: () => void;
};

const getGridClass = (count: number) => {
  if (count === 1) return "grid-cols-1";
  return "grid-cols-2";
};

export function SelectedMediaPreview({
  selectedImages,
  selectedGif,
  maxImageCount,
  onRemoveImage,
  onRemoveGif,
}: SelectedMediaPreviewProps) {
  const imageCount = selectedImages.length;
  const hasImages = imageCount > 0;
  const hasGif = Boolean(selectedGif);

  return (
    <>
      {hasImages && (
        <div className="min-w-0 px-4 pb-3">
          <div className={`grid ${getGridClass(imageCount)} gap-2`}>
            {selectedImages.map((image, index) => {
              const isThreeFirst = imageCount === 3 && index === 0;
              return (
                <div
                  key={index}
                  className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 ${
                    isThreeFirst ? "col-span-2" : ""
                  }`}
                >
                  <img
                    src={image.preview}
                    alt={`Selected media ${index + 1}`}
                    className={`w-full object-cover ${
                      isThreeFirst ? "max-h-56" : "max-h-48"
                    }`}
                  />
                  <button
                    onClick={() => onRemoveImage(index)}
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

      {hasGif && (
        <div className="relative inline-block max-w-[calc(100%-4.5rem)] px-4 pb-3">
          <img
            src={selectedGif!}
            alt="Selected GIF"
            className="max-h-72 max-w-full rounded-2xl border border-slate-200 object-cover"
          />
          <button
            onClick={onRemoveGif}
            className="absolute top-2 right-6 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-slate-950/65 text-white transition hover:bg-slate-950"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
