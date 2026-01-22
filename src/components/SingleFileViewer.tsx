import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ResultFile } from '@/types/lab';
import { isImage } from '@/types/lab';

interface SingleFileViewerProps {
  file: ResultFile;
  onClose: () => void;
  onDownload: () => void;
}

export function SingleFileViewer({ file, onClose, onDownload }: SingleFileViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        <h2 className="text-lg font-semibold text-foreground truncate max-w-[60%]">
          {file.name}
        </h2>
        <div className="flex items-center gap-2">
          {isImage(file) && (
            <>
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
            </>
          )}
          <Button
            variant="outline"
            onClick={onDownload}
            className="gap-2 border-accent/30 hover:bg-accent/10"
          >
            <Download className="w-4 h-4" />
            تحميل
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

      {/* Content */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        {isImage(file) ? (
          <motion.img
            src={file.viewUrl}
            alt={file.name}
            className="max-w-full max-h-full object-contain"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease',
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            draggable={false}
          />
        ) : (
          <iframe
            src={file.viewUrl}
            className="w-full h-full border-0 rounded-lg"
            title={file.name}
          />
        )}
      </div>
    </motion.div>
  );
}
