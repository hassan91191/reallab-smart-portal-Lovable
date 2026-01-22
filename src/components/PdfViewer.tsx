import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PDFDocument } from 'pdf-lib';
import type { ResultFile } from '@/types/lab';

interface PdfViewerProps {
  pdfs: ResultFile[];
  onClose: () => void;
  onDownloadMerged: (blob: Blob) => void;
  downloadFile: (file: ResultFile) => Promise<Blob>;
}

export function PdfViewer({ pdfs, onClose, onDownloadMerged, downloadFile }: PdfViewerProps) {
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function mergePdfs() {
      try {
        setIsLoading(true);
        setProgress(0);

        const mergedPdf = await PDFDocument.create();

        for (let i = 0; i < pdfs.length; i++) {
          if (isCancelled) return;

          const pdf = pdfs[i];
          setProgress(Math.round(((i + 0.5) / pdfs.length) * 100));

          try {
            const pdfBlob = await downloadFile(pdf);
            const pdfBytes = await pdfBlob.arrayBuffer();
            const loadedPdf = await PDFDocument.load(pdfBytes);
            const pages = await mergedPdf.copyPages(loadedPdf, loadedPdf.getPageIndices());
            pages.forEach((page) => mergedPdf.addPage(page));
          } catch (err) {
            console.error(`Failed to load PDF: ${pdf.name}`, err);
          }

          setProgress(Math.round(((i + 1) / pdfs.length) * 100));
        }

        if (isCancelled) return;

        const mergedPdfBytes = await mergedPdf.save();
        const blob = new Blob([mergedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setMergedPdfUrl(url);
        setIsLoading(false);
      } catch (err) {
        if (!isCancelled) {
          setError('فشل في دمج ملفات PDF');
          setIsLoading(false);
        }
      }
    }

    if (pdfs.length === 1) {
      // Single PDF - just display it
      setMergedPdfUrl(pdfs[0].viewUrl);
      setIsLoading(false);
    } else {
      mergePdfs();
    }

    return () => {
      isCancelled = true;
      if (mergedPdfUrl) {
        URL.revokeObjectURL(mergedPdfUrl);
      }
    };
  }, [pdfs, downloadFile]);

  const handleDownloadMerged = async () => {
    if (mergedPdfUrl) {
      const response = await fetch(mergedPdfUrl);
      const blob = await response.blob();
      onDownloadMerged(blob);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        <h2 className="text-lg font-semibold text-foreground">
          {pdfs.length > 1 ? 'جميع ملفات PDF' : pdfs[0]?.name}
        </h2>
        <div className="flex items-center gap-2">
          {!isLoading && mergedPdfUrl && (
            <Button
              variant="outline"
              onClick={handleDownloadMerged}
              className="gap-2 border-accent/30 hover:bg-accent/10"
            >
              <Download className="w-4 h-4" />
              تحميل الملف المدمج
            </Button>
          )}
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
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center gap-6">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <div className="text-center space-y-2">
              <p className="text-foreground font-medium">جار دمج ملفات PDF...</p>
              <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full progress-bar rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-muted-foreground text-sm">{progress}%</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-destructive">{error}</p>
          </div>
        ) : mergedPdfUrl ? (
          <iframe
            src={mergedPdfUrl}
            className="w-full h-full border-0"
            title="PDF Viewer"
          />
        ) : null}
      </div>
    </motion.div>
  );
}
