import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ResultFile } from '@/types/lab';

interface ImageGalleryProps {
  images: ResultFile[];
  initialIndex: number;
  onClose: () => void;
  onDownload: (file: ResultFile) => void;
}

export function ImageGallery({ images, initialIndex, onClose, onDownload }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const currentImage = images[currentIndex];

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setZoom(1);
    setRotation(0);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setZoom(1);
    setRotation(0);
  }, [images.length]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between">
        <div className="glass-card px-4 py-2 rounded-xl">
          <span className="text-foreground font-medium">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            className="glass-card rounded-xl hover:bg-primary/10"
          >
            <ZoomOut className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            className="glass-card rounded-xl hover:bg-primary/10"
          >
            <ZoomIn className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRotate}
            className="glass-card rounded-xl hover:bg-primary/10"
          >
            <RotateCw className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDownload(currentImage)}
            className="glass-card rounded-xl hover:bg-accent/10"
          >
            <Download className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="glass-card rounded-xl hover:bg-destructive/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Image Container */}
      <div className="absolute inset-0 flex items-center justify-center p-16 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={currentImage.viewUrl}
            alt={currentImage.name}
            className="max-w-full max-h-full object-contain"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease',
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            draggable={false}
          />
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={goPrev}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 glass-card rounded-xl hover:bg-primary/10"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goNext}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 glass-card rounded-xl hover:bg-primary/10"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <div className="glass-card rounded-xl p-2 flex gap-2 overflow-x-auto max-w-[90vw]">
            {images.map((img, idx) => (
              <motion.button
                key={img.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  setZoom(1);
                  setRotation(0);
                }}
                className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all
                  ${idx === currentIndex ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <img
                  src={img.viewUrl || img.downloadUrl || ""}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
