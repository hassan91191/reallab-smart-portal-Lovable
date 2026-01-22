import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Eye, Image, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LabHeader } from '@/components/LabHeader';
import { Footer } from '@/components/Footer';
import { ResultCard } from '@/components/ResultCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { ImageGallery } from '@/components/ImageGallery';
import { PdfViewer } from '@/components/PdfViewer';
import { SingleFileViewer } from '@/components/SingleFileViewer';
import { DownloadProgress } from '@/components/DownloadProgress';
import { downloadFile, logAccess } from '@/lib/api';
import type { LabConfig, ResultFile } from '@/types/lab';
import { isImage, isPdf } from '@/types/lab';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface ResultsPageProps {
  labConfig: LabConfig;
  patientId: string;
  files: ResultFile[];
  isLoading?: boolean;
}

type ViewerMode = 'none' | 'single' | 'images' | 'pdfs' | 'choose';

export function ResultsPage({ labConfig, patientId, files, isLoading }: ResultsPageProps) {
  const [viewerMode, setViewerMode] = useState<ViewerMode>('none');
  const [selectedFile, setSelectedFile] = useState<ResultFile | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [downloadState, setDownloadState] = useState<{
    show: boolean;
    current: number;
    total: number;
    isComplete: boolean;
    isError: boolean;
  }>({ show: false, current: 0, total: 0, isComplete: false, isError: false });

  const imageFiles = files.filter(isImage);
  const pdfFiles = files.filter(isPdf);
  const hasImages = imageFiles.length > 0;
  const hasPdfs = pdfFiles.length > 0;
  const hasMixed = hasImages && hasPdfs;

  const handleDownloadFileBlob = useCallback(async (file: ResultFile): Promise<Blob> => {
    return downloadFile(labConfig.labKey, patientId, file.id);
  }, [labConfig.labKey, patientId]);

  const handleViewFile = useCallback(async (file: ResultFile) => {
    await logAccess(labConfig.labKey, patientId, file.id, 'view');
    setSelectedFile(file);
    setViewerMode('single');
  }, [labConfig.labKey, patientId]);

  const handleDownloadSingleFile = useCallback(async (file: ResultFile) => {
    try {
      await logAccess(labConfig.labKey, patientId, file.id, 'download');
      const blob = await downloadFile(labConfig.labKey, patientId, file.id);
      saveAs(blob, file.name);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, [labConfig.labKey, patientId]);

  const handleViewAll = useCallback(() => {
    if (hasMixed) {
      setViewerMode('choose');
    } else if (hasImages) {
      setSelectedIndex(0);
      setViewerMode('images');
      // Log all image views
      imageFiles.forEach(f => logAccess(labConfig.labKey, patientId, f.id, 'view'));
    } else if (hasPdfs) {
      setViewerMode('pdfs');
      // Log all PDF views
      pdfFiles.forEach(f => logAccess(labConfig.labKey, patientId, f.id, 'view'));
    }
  }, [hasMixed, hasImages, hasPdfs, imageFiles, pdfFiles, labConfig.labKey, patientId]);

  const handleViewImages = useCallback(() => {
    setSelectedIndex(0);
    setViewerMode('images');
    imageFiles.forEach(f => logAccess(labConfig.labKey, patientId, f.id, 'view'));
  }, [imageFiles, labConfig.labKey, patientId]);

  const handleViewPdfs = useCallback(() => {
    setViewerMode('pdfs');
    pdfFiles.forEach(f => logAccess(labConfig.labKey, patientId, f.id, 'view'));
  }, [pdfFiles, labConfig.labKey, patientId]);

  const handleDownloadAll = useCallback(async () => {
    setDownloadState({ show: true, current: 0, total: files.length, isComplete: false, isError: false });

    try {
      const zip = new JSZip();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await logAccess(labConfig.labKey, patientId, file.id, 'download');
        const blob = await downloadFile(labConfig.labKey, patientId, file.id);
        zip.file(file.name, blob);
        setDownloadState(prev => ({ ...prev, current: i + 1 }));
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `نتائج_التحاليل_${patientId}.zip`);
      setDownloadState(prev => ({ ...prev, isComplete: true }));

      setTimeout(() => {
        setDownloadState(prev => ({ ...prev, show: false }));
      }, 3000);
    } catch (error) {
      console.error('Download all failed:', error);
      setDownloadState(prev => ({ ...prev, isError: true }));
    }
  }, [files, labConfig.labKey, patientId]);

  const handleDownloadMergedPdf = useCallback((blob: Blob) => {
    saveAs(blob, `نتائج_التحاليل_${patientId}.pdf`);
  }, [patientId]);

  const closeViewer = () => {
    setViewerMode('none');
    setSelectedFile(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container max-w-2xl mx-auto flex-1 flex flex-col px-4">
        <LabHeader labConfig={labConfig} />

        {/* Action Buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-3 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handleDownloadAll}
            disabled={files.length === 0 || downloadState.show}
            className="flex-1 h-14 text-lg font-semibold rounded-xl
                       bg-gradient-to-r from-accent to-accent/80
                       hover:opacity-90 transition-opacity
                       disabled:opacity-50 shadow-glow gap-2"
          >
            <Download className="w-5 h-5" />
            تحميل جميع النتائج
          </Button>
          <Button
            onClick={handleViewAll}
            disabled={files.length === 0}
            variant="outline"
            className="flex-1 h-14 text-lg font-semibold rounded-xl
                       border-primary/30 bg-primary/5
                       hover:bg-primary/10 hover:border-primary/50
                       transition-all gap-2"
          >
            <Eye className="w-5 h-5" />
            عرض جميع النتائج
          </Button>
        </motion.div>

        {/* Results Grid */}
        <motion.div 
          className="grid gap-4 pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {isLoading ? (
            <SkeletonCard count={4} />
          ) : files.length === 0 ? (
            <motion.div 
              className="glass-card rounded-2xl p-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-muted-foreground">لا توجد نتائج متاحة حالياً</p>
            </motion.div>
          ) : (
            files.map((file, index) => (
              <ResultCard
                key={file.id}
                file={file}
                index={index}
                onView={() => handleViewFile(file)}
                onDownload={() => handleDownloadSingleFile(file)}
              />
            ))
          )}
        </motion.div>
      </div>

      <Footer />

      {/* Viewers */}
      <AnimatePresence>
        {viewerMode === 'single' && selectedFile && (
          <SingleFileViewer
            file={selectedFile}
            onClose={closeViewer}
            onDownload={() => handleDownloadSingleFile(selectedFile)}
          />
        )}

        {viewerMode === 'images' && (
          <ImageGallery
            images={imageFiles}
            initialIndex={selectedIndex}
            onClose={closeViewer}
            onDownload={handleDownloadSingleFile}
          />
        )}

        {viewerMode === 'pdfs' && (
          <PdfViewer
            pdfs={pdfFiles}
            onClose={closeViewer}
            onDownloadMerged={handleDownloadMergedPdf}
            downloadFile={handleDownloadFileBlob}
          />
        )}

        {viewerMode === 'choose' && (
          <motion.div
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeViewer}
          >
            <motion.div
              className="glass-card rounded-3xl p-6 md:p-8 max-w-sm w-full space-y-6"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-center text-foreground">
                اختر نوع الملفات
              </h3>
              <div className="space-y-3">
                <Button
                  onClick={handleViewImages}
                  className="w-full h-14 text-lg rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 gap-3"
                  variant="ghost"
                >
                  <Image className="w-6 h-6" />
                  عرض الصور ({imageFiles.length})
                </Button>
                <Button
                  onClick={handleViewPdfs}
                  className="w-full h-14 text-lg rounded-xl bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 gap-3"
                  variant="ghost"
                >
                  <FileText className="w-6 h-6" />
                  عرض ملفات PDF ({pdfFiles.length})
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {downloadState.show && (
          <DownloadProgress
            current={downloadState.current}
            total={downloadState.total}
            isComplete={downloadState.isComplete}
            isError={downloadState.isError}
            onClose={() => setDownloadState(prev => ({ ...prev, show: false }))}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
