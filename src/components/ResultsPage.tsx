import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LabHeader } from '@/components/LabHeader';
import { Footer } from '@/components/Footer';
import { ResultCard } from '@/components/ResultCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { DownloadProgress } from '@/components/DownloadProgress';
import { downloadFile, logAccess } from '@/lib/api';
import type { LabConfig, ResultFile } from '@/types/lab';
import { saveAs } from 'file-saver';

interface ResultsPageProps {
  labConfig: LabConfig | null;
  patientId: string;
  files: ResultFile[];
  isLoading?: boolean;
}

interface DownloadState {
  show: boolean;
  current: number;
  total: number;
  isComplete: boolean;
  isError: boolean;
}

export function ResultsPage({ labConfig, patientId, files, isLoading = false }: ResultsPageProps) {
  const navigate = useNavigate();
  const [downloadState, setDownloadState] = useState<DownloadState>({
    show: false,
    current: 0,
    total: 0,
    isComplete: false,
    isError: false,
  });

  const labKey = labConfig?.labKey || '';

  const navigateToAll = useCallback(() => {
    navigate(`/all?lab=${encodeURIComponent(labKey)}&id=${encodeURIComponent(patientId)}`);
  }, [navigate, labKey, patientId]);

  const navigateToFile = useCallback((fileId: string) => {
    navigate(`/file?lab=${encodeURIComponent(labKey)}&id=${encodeURIComponent(patientId)}&fileId=${encodeURIComponent(fileId)}`);
  }, [navigate, labKey, patientId]);

  const handleViewAll = useCallback(async () => {
    if (!labKey || !patientId) return;

    // Log once for the "bulk" action + per-file view
    try { await logAccess(labKey, patientId, 'ALL', 'VIEW_ALL', ''); } catch {}
    try {
      await Promise.allSettled(files.map(f => logAccess(labKey, patientId, f.id, \'VIEW\', f.name)));
    } catch {}

    navigateToAll();
  }, [files, labKey, patientId, navigateToAll]);

  const handleViewFile = useCallback(async (file: ResultFile) => {
    if (!labKey || !patientId) return;
    try { await logAccess(labKey, patientId, file.id, \'VIEW\', file.name); } catch {}
    navigateToFile(file.id);
  }, [labKey, patientId, navigateToFile]);

  const handleDownloadOne = useCallback(async (file: ResultFile) => {
    if (!labKey || !patientId) return;
    try { await logAccess(labKey, patientId, file.id, \'DOWNLOAD\', file.name); } catch {}
    const blob = await downloadFile(labKey, patientId, file.id);
    saveAs(blob, file.name || 'result');
  }, [labKey, patientId]);

  const handleDownloadAll = useCallback(async () => {
    if (!labKey || !patientId || files.length === 0) return;

    setDownloadState({
      show: true,
      current: 0,
      total: files.length,
      isComplete: false,
      isError: false,
    });

    try { await logAccess(labKey, patientId, 'ALL', 'DOWNLOAD_ALL', ''); } catch {}

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        try { await logAccess(labKey, patientId, file.id, \'DOWNLOAD\', file.name); } catch {}
        const blob = await downloadFile(labKey, patientId, file.id);
        saveAs(blob, file.name || `result_${i + 1}`);
      } catch (e) {
        setDownloadState(prev => ({ ...prev, isError: true }));
      }

      setDownloadState(prev => ({ ...prev, current: i + 1 }));

      // Small delay so browsers/mobile can handle sequential downloads
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    setDownloadState(prev => ({ ...prev, isComplete: true }));
  }, [files, labKey, patientId]);

  const isEmpty = !isLoading && files.length === 0;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-10 flex-1 w-full max-w-5xl">
        <LabHeader labConfig={labConfig} />

        {/* Main Title */}
        <motion.div
          className="text-center mt-10 mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            نتائج التحاليل
          </h1>
          <p className="text-muted-foreground">
            يمكنك عرض أو تحميل النتائج الخاصة بك
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center mb-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
        >
          <Button
            onClick={handleViewAll}
            disabled={files.length === 0}
            variant="outline"
            className="h-12 px-8 rounded-2xl border-primary/30 bg-primary/5 hover:bg-primary/10 gap-2 transition-all active:scale-[0.98]"
          >
            <Eye className="w-5 h-5" />
            عرض جميع النتائج
          </Button>

          <Button
            onClick={handleDownloadAll}
            disabled={files.length === 0 || downloadState.show}
            className="h-12 px-8 rounded-2xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity disabled:opacity-50 shadow-glow gap-2 transition-all active:scale-[0.98]"
          >
            <Download className="w-5 h-5" />
            تحميل جميع النتائج
          </Button>
        </motion.div>

        {/* Results List */}
        <div className="space-y-4">
          {isLoading && Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}

          {!isLoading && files.map((file, index) => (
            <ResultCard
              key={file.id}
              file={file}
              index={index}
              onView={() => handleViewFile(file)}
              onDownload={() => handleDownloadOne(file)}
            />
          ))}

          {isEmpty && (
            <motion.div
              className="text-center py-14 text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              لا توجد نتائج متاحة حالياً.
            </motion.div>
          )}
        </div>

        <Footer />
      </div>

      {downloadState.show && (
        <DownloadProgress
          current={downloadState.current}
          total={downloadState.total}
          isComplete={downloadState.isComplete}
          isError={downloadState.isError}
          onClose={() => setDownloadState(prev => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
}
