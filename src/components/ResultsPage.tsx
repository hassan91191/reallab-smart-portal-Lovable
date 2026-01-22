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

      const url = file.downloadUrl || file.viewUrl;
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }

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
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Log as if viewed
        await logAccess(labConfig.labKey, patientId, file.id, 'download');

        // Trigger direct download (no ZIP) - best for mobile
        const url = file.downloadUrl || file.viewUrl;
        if (url) {
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name || `result_${i + 1}`;
          a.rel = 'noopener';
          document.body.appendChild(a);
          a.click();
          a.remove();
        } else {
          // Fallback to blob download
          const blob = await downloadFile(labConfig.labKey, patientId, file.id);
          saveAs(blob, file.name);
        }

        setDownloadState(prev => ({ ...prev, current: i + 1 }));
        // Small delay so browsers/mobile can handle sequential downloads
        await new Promise(resolve => setTimeout(resolve, 350));
      }

      setDownloadState(prev => ({ ...prev, isComplete: true }));

      setTimeout(() => {
        setDownloadState(prev => ({ ...prev, show: false }));
      }, 2500);
    } catch (error) {
      console.error('Download all failed:', error);
      setDownloadState(prev => ({ ...prev, isError: true }));
    }
  }, [files, labConfig.labKey, patientId]);
