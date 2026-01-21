import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PortalHeader } from '@/components/portal/PortalHeader';
import { PortalFooter } from '@/components/portal/PortalFooter';
import { fetchLabConfig, getFileDownloadUrl, getFileForcedDownloadUrl, logFileAccess } from '@/lib/api';
import type { LabConfig } from '@/types/portal';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function ViewResult() {
  const navigate = useNavigate();
  const qp = useQuery();

  const [labConfig, setLabConfig] = useState<LabConfig | undefined>();
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  const lab = (qp.get('lab') || '').trim();
  const patientId = (qp.get('id') || '').trim();
  const fileId = (qp.get('fileId') || '').trim();
  const fileName = (qp.get('name') || 'result').trim();
  const mime = (qp.get('mime') || '').trim().toLowerCase();

  useEffect(() => {
    if (!lab) return;
    setIsLoadingConfig(true);
    fetchLabConfig(lab)
      .then(setLabConfig)
      .catch(() => setLabConfig({ title: 'مختبر التحاليل' }))
      .finally(() => setIsLoadingConfig(false));
  }, [lab]);

  const inlineUrl = useMemo(() => {
    if (!lab || !patientId || !fileId) return '';
    return getFileDownloadUrl(lab, patientId, fileId);
  }, [lab, patientId, fileId]);

  const downloadUrl = useMemo(() => {
    if (!lab || !patientId || !fileId) return '';
    return getFileForcedDownloadUrl(lab, patientId, fileId);
  }, [lab, patientId, fileId]);

  // Log access when the viewer opens (VIEW)
  useEffect(() => {
    if (!lab || !patientId || !fileId) return;
    logFileAccess(lab, patientId, fileId, fileName, 'view').catch(() => {});
  }, [lab, patientId, fileId, fileName]);

  const handleDownload = async () => {
    if (!downloadUrl) return;
    try {
      // Mark as view-equivalent as requested
      await logFileAccess(lab, patientId, fileId, fileName, 'view');
    } catch {
      // ignore
    }
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const canEmbedPdf = mime.includes('pdf') || fileName.toLowerCase().endsWith('.pdf');
  const isImage = mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileName);

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <PortalHeader config={labConfig} isLoading={isLoadingConfig} />

      <main className="flex-1 px-4 pb-10">
        <div className="max-w-5xl mx-auto">
          <div className="mt-6 bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
            <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-foreground truncate">{fileName}</h2>
                <p className="text-sm text-muted-foreground truncate">عرض النتيجة</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2 rounded-xl" onClick={() => navigate(-1)}>
                  <ArrowLeft className="w-4 h-4" />
                  رجوع
                </Button>
                <Button className="gap-2 rounded-xl" onClick={handleDownload}>
                  <Download className="w-4 h-4" />
                  تحميل
                </Button>
              </div>
            </div>

            <div className="bg-muted/40">
              {!inlineUrl ? (
                <div className="p-10 text-center text-muted-foreground">الرابط غير مكتمل</div>
              ) : canEmbedPdf ? (
                <iframe title="result" src={inlineUrl} className="w-full h-[80vh]" />
              ) : isImage ? (
                <div className="p-4 sm:p-8 flex items-center justify-center">
                  <img src={inlineUrl} alt={fileName} className="max-w-full max-h-[80vh] rounded-xl shadow-sm" />
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">هذا الملف لا يمكن عرضه داخل الصفحة.</p>
                  <Button className="gap-2 rounded-xl" onClick={handleDownload}>
                    <Download className="w-4 h-4" />
                    تحميل الملف
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <PortalFooter />
    </div>
  );
}
