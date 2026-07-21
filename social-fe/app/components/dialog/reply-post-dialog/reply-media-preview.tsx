import { ImagePreview } from "@/app/interfaces/dialog/dialog.interface";
import { X } from "lucide-react";

type ReplyMediaPreviewProps = {
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

export function ReplyMediaPreview({
  selectedImages,
  selectedGif,
  maxImageCount,
  onRemoveImage,
  onRemoveGif,
}: ReplyMediaPreviewProps) {
  const imageCount = selectedImages.length;

  return (
    <>
      {imageCount > 0 && (
        <div className="px-4 pb-2 ml-14">
          <div className={`grid ${getGridClass(imageCount)} gap-1.5`}>
            {selectedImages.map((image, index) => {
              const isThreeFirst = imageCount === 3 && index === 0;
              return (
                <div
                  key={index}
                  className={`relative ${isThreeFirst ? "col-span-2" : ""}`}
                >
                  <img
                    src={image.preview}
                    alt={`Selected media ${index + 1}`}
                    className={`rounded-xl w-full object-cover border border-gray-200 ${
                      isThreeFirst ? "max-h-48" : "max-h-40"
                    }`}
                  />
                  <button
                    onClick={() => onRemoveImage(index)}
                    className="absolute top-1.5 right-1.5 bg-gray-900/60 hover:bg-gray-900 flex items-center justify-center w-6 h-6 rounded-full text-white transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
          {imageCount < maxImageCount && (
            <p className="text-xs text-gray-400 mt-1.5">
              {imageCount}/{maxImageCount} images - You can add{" "}
              {maxImageCount - imageCount} more
            </p>
          )}
        </div>
      )}

      {selectedGif && (
        <div className="relative px-4 pb-2 ml-14">
          <img
            src={selectedGif}
            alt="Selected GIF"
            className="rounded-xl max-h-62.5 w-auto object-cover border border-gray-200"
          />
          <button
            onClick={onRemoveGif}
            className="absolute top-2 right-6 bg-gray-900/60 hover:bg-gray-900 flex items-center justify-center w-7 h-7 rounded-full text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}
