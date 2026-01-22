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
import { getLabConfig, getPatientFiles, downloadFile, logAccess } from '@/lib/api';
import { prettifyFileName } from '@/lib/utils';
import type { LabConfig, ResultFile } from '@/types/lab';
import { isImage, isPdf } from '@/types/lab';
import { saveAs } from 'file-saver';

type State = 'loading' | 'ready' | 'error' | 'missing';

export default function ViewFile() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const labKey = searchParams.get('lab') || '';
  const patientId = searchParams.get('id') || '';
  const fileId = searchParams.get('fileId') || '';

  const [labConfig, setLabConfig] = useState<LabConfig | null>(null);
  const [file, setFile] = useState<ResultFile | null>(null);
  const [state, setState] = useState<State>('loading');

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!labKey || !patientId || !fileId) {
        setState('missing');
        return;
      }
      try {
        setState('loading');
        const cfg = await getLabConfig(labKey);
        const fs = await getPatientFiles(labKey, patientId);
        const f = fs.find(x => x.id === fileId) || null;
        if (cancelled) return;
        setLabConfig(cfg);
        setFile(f);
        setState('ready');

        // Safety: if opened directly
        if (f) {
          try { await logAccess(labKey, patientId, f.id, \'VIEW\', f.name); } catch {}
        }
      } catch {
        if (!cancelled) setState('error');
      }
    }
    run();
    return () => { cancelled = true; };
  }, [labKey, patientId, fileId]);

  const handleBack = () => {
    navigate(`/?lab=${encodeURIComponent(labKey)}&id=${encodeURIComponent(patientId)}`);
  };

  const handleDownload = async () => {
    if (!file) return;
    try { await logAccess(labKey, patientId, file.id, \'DOWNLOAD\', file.name); } catch {}
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
  if (state === 'error') return <StatusScreen type="error" onRetry={() => window.location.reload()} />;

  if (!file) {
    return <StatusScreen type="error" title="الملف غير موجود" subtitle="تعذر العثور على هذه النتيجة." onRetry={handleBack} />;
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

          <h1 className="text-base md:text-lg font-bold text-foreground text-center px-2 break-words">
            {prettifyFileName(file.name)}
          </h1>

          <Button onClick={handleDownload} className="rounded-xl gap-2" variant="outline">
            <Download className="w-4 h-4" />
            تحميل
          </Button>
        </div>

        <LabHeader labConfig={labConfig} />

        <motion.div
          className="mt-8 glass-card glow-ring rounded-2xl p-4 md:p-6 overflow-hidden"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="rounded-xl overflow-hidden bg-black/15">
            {isImage(file) ? (
              <img
                src={file.viewUrl || file.downloadUrl || ''}
                alt={file.name}
                className="w-full h-auto"
                style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
              />
            ) : isPdf(file) ? (
              <PdfPagesViewer url={file.viewUrl || file.downloadUrl || ''} />
            ) : (
              <div className="p-6 text-sm text-muted-foreground">
                لا يمكن عرض هذا النوع من الملفات داخل الصفحة.
              </div>
            )}
          </div>
        </motion.div>

        <Footer />
      </div>
    </div>
  );
}
