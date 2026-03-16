"use client";

import React, { useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PostMedia } from "@/app/interfaces/post.interface";

export interface ZoomData {
  media: PostMedia[];
  currentIndex: number;
}

interface ImageZoomDialogProps {
  zoomData: ZoomData | null;
  onClose: () => void;
  onChangeIndex: (index: number) => void;
}

const ImageZoomDialog = React.memo(
  ({ zoomData, onClose, onChangeIndex }: ImageZoomDialogProps) => {
    const handlePrev = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (zoomData && zoomData.currentIndex > 0) {
          onChangeIndex(zoomData.currentIndex - 1);
        }
      },
      [zoomData, onChangeIndex],
    );

    const handleNext = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (zoomData && zoomData.currentIndex < zoomData.media.length - 1) {
          onChangeIndex(zoomData.currentIndex + 1);
        }
      },
      [zoomData, onChangeIndex],
    );

    return (
      <Dialog open={!!zoomData} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0 border-none bg-black/95 flex items-center justify-center overflow-hidden">
          <DialogTitle className="sr-only">Zoom Image</DialogTitle>

          {zoomData && (
            <div className="relative w-full h-full flex items-center justify-center group">
              {zoomData.currentIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="absolute left-4 z-50 p-3 rounded-full bg-black/50 hover:bg-white/20 text-white transition-all backdrop-blur-sm cursor-pointer"
                >
                  <ChevronLeft size={28} />
                </button>
              )}

              <img
                src={zoomData.media[zoomData.currentIndex].mediaUrl}
                alt={
                  zoomData.media[zoomData.currentIndex].altText ??
                  "Zoomed image"
                }
                className="max-w-full max-h-full object-contain"
              />

              {zoomData.currentIndex < zoomData.media.length - 1 && (
                <button
                  onClick={handleNext}
                  className="absolute right-4 z-50 p-3 rounded-full bg-black/50 hover:bg-white/20 text-white transition-all backdrop-blur-sm cursor-pointer"
                >
                  <ChevronRight size={28} />
                </button>
              )}

              {zoomData.media.length > 1 && (
                <div className="absolute top-4 left-4 z-50 px-3 py-1 rounded-full bg-black/50 text-white text-sm backdrop-blur-sm">
                  {zoomData.currentIndex + 1} / {zoomData.media.length}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  },
);

ImageZoomDialog.displayName = "ImageZoomDialog";

export default ImageZoomDialog;
