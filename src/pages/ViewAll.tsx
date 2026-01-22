import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LabHeader } from '@/components/LabHeader';
import { Footer } from '@/components/Footer';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PdfPagesViewer } from '@/components/PdfPagesViewer';
import { StatusScreen } from '@/components/StatusScreen';
import { BlockedPage } from '@/components/BlockedPage';
import { getLabConfig, getPatientFiles, downloadFile, logAccess } from '@/lib/api';
import { prettifyFileName } from '@/lib/utils';
import type { LabConfig, ResultFile } from '@/types/lab';
import { isImage, isPdf } from '@/types/lab';
import { saveAs } from 'file-saver';

type State = 'loading' | 'ready' | 'blocked' | 'error' | 'missing';

export default function ViewAll() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const labKey = searchParams.get('lab') || '';
  const patientId = searchParams.get('id') || '';

  const [labConfig, setLabConfig] = useState<LabConfig | null>(null);
  const [files, setFiles] = useState<ResultFile[]>([]);
  const [blockedAmount, setBlockedAmount] = useState<number>(0);
  const [state, setState] = useState<State>('loading');

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!labKey || !patientId) {
        setState('missing');
        return;
      }
      try {
        setState('loading');
        const cfg = await getLabConfig(labKey);
        const resp = await getPatientFiles(labKey, patientId);
        if (cancelled) return;
        setLabConfig(cfg);
        if (resp.blocked) {
          setFiles([]);
          setBlockedAmount(Number(resp.amount || 0));
          setState('blocked');
          try {
            const k = `blocked_logged_${labKey}_${patientId}`;
            if (!sessionStorage.getItem(k)) {
              sessionStorage.setItem(k, '1');
              await logAccess(labKey, patientId, resp.markerFileId || 'BLOCKED', 'BLOCKED', resp.markerFileName || '');
            }
          } catch {}
          return;
        }
        setFiles(resp.files);
        setState('ready');

        // Safety: if someone opens this page directly, still log a single "VIEW_ALL"
        try {
          await logAccess(labKey, patientId, 'ALL', 'VIEW_ALL', '');
        } catch {}
      } catch (e) {
        if (!cancelled) setState('error');
      }
    }
    run();
    return () => { cancelled = true; };
  }, [labKey, patientId]);

  const handleBack = () => {
    navigate(`/?lab=${encodeURIComponent(labKey)}&id=${encodeURIComponent(patientId)}`);
  };

  const handleDownload = async (file: ResultFile) => {
    try {
      await logAccess(labKey, patientId, file.id, 'DOWNLOAD', file.name);
    } catch {}
    const blob = await downloadFile(labKey, patientId, file.id);
    saveAs(blob, file.name || 'result');
  };

  if (state === 'missing') {
    return <StatusScreen type="missing-lab" title="جار ظهور البيانات" subtitle="الرابط المستخدم غير صحيح. يرجى التأكد من استخدام الرابط الصحيح للوصول إلى النتائج." onRetry={handleBack} />;
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (state === 'error') {
    return <StatusScreen type="error" onRetry={() => window.location.reload()} />;
  }

  if (state === 'blocked') {
    return <BlockedPage labConfig={labConfig} amount={blockedAmount} />;
  }


  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-6 flex-1 w-full max-w-5xl">
        <div className="flex items-center justify-between mb-6 gap-3">
          <Button variant="outline" onClick={handleBack} className="rounded-xl gap-2">
            <ArrowLeft className="w-4 h-4" />
            رجوع
          </Button>
          <h1 className="text-lg md:text-xl font-bold text-foreground">
            عرض جميع النتائج
          </h1>
          <div className="w-[92px]" />
        </div>

        <LabHeader labConfig={labConfig} />

        <div className="mt-8 space-y-8">
          {files.map((file, idx) => (
            <motion.section
              key={file.id}
              className="glass-card glow-ring rounded-2xl p-4 md:p-6 overflow-hidden"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.35 }}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <h2 className="text-base md:text-lg font-semibold text-foreground break-words">
                    {prettifyFileName(file.name)}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isPdf(file) ? 'PDF' : isImage(file) ? 'صورة' : 'ملف'}
                  </p>
                </div>
                <Button
                  onClick={() => handleDownload(file)}
                  className="rounded-xl gap-2 shrink-0"
                  variant="outline"
                >
                  <Download className="w-4 h-4" />
                  تحميل
                </Button>
              </div>

              <div className="rounded-xl overflow-hidden bg-black/15">
                {isImage(file) ? (
                  <img
                    src={file.viewUrl || file.downloadUrl || ''}
                    alt={file.name}
                    className="w-full h-auto"
                    style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
                    loading="lazy"
                  />
                ) : isPdf(file) ? (
                  <PdfPagesViewer url={file.viewUrl || file.downloadUrl || ''} />
                ) : (
                  <div className="p-6 text-sm text-muted-foreground">
                    لا يمكن عرض هذا النوع من الملفات داخل الصفحة.
                  </div>
                )}
              </div>
            </motion.section>
          ))}
        </div>

        <Footer />
      </div>
    </div>
  );
}
