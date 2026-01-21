import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PortalState, PatientFile, LabConfig } from '@/types/portal';
import { fetchLabConfig, fetchPatientFiles, logFileAccess, getFileForcedDownloadUrl } from '@/lib/api';
import { PortalHeader } from '@/components/portal/PortalHeader';
import { PortalFooter } from '@/components/portal/PortalFooter';
import { PatientIdForm } from '@/components/portal/PatientIdForm';
import { FileList } from '@/components/portal/FileList';
import { LoadingSkeleton } from '@/components/portal/LoadingSkeleton';
import { ErrorState } from '@/components/portal/ErrorState';

export default function Index() {
  const navigate = useNavigate();
  const [state, setState] = useState<PortalState>({ status: 'missing-lab' });
  const [labConfig, setLabConfig] = useState<LabConfig | undefined>();
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  // Parse URL params on mount and when URL changes
  const parseUrlAndLoad = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    const lab = params.get('lab');
    const id = params.get('id');

    if (!lab) {
      setState({ status: 'missing-lab' });
      return;
    }

    // Fetch lab config
    setIsLoadingConfig(true);
    try {
      const config = await fetchLabConfig(lab);
      setLabConfig(config);
    } catch (error) {
      console.error('Failed to fetch lab config:', error);
      // Use default config if fetch fails
      setLabConfig({ title: 'مختبر التحاليل' });
    } finally {
      setIsLoadingConfig(false);
    }

    if (!id) {
      setState({ status: 'needs-patient-id', lab });
      return;
    }

    // Load patient files
    setState({ status: 'loading', lab, patientId: id });
    
    try {
      const [config, files] = await Promise.all([
        fetchLabConfig(lab).catch(() => ({ title: 'مختبر التحاليل' })),
        fetchPatientFiles(lab, id),
      ]);
      
      setLabConfig(config);
      setState({ status: 'loaded', lab, patientId: id, config, files });
    } catch (error) {
      console.error('Failed to load patient files:', error);
      setState({
        status: 'error',
        lab,
        patientId: id,
        message: 'فشل في تحميل نتائج التحاليل. يرجى المحاولة مرة أخرى.',
      });
    }
  }, []);

  useEffect(() => {
    parseUrlAndLoad();

    // Listen for popstate events (back/forward navigation)
    const handlePopState = () => {
      parseUrlAndLoad();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [parseUrlAndLoad]);

  // Handle patient ID submission
  const handlePatientIdSubmit = async (patientId: string) => {
    if (state.status !== 'needs-patient-id') return;

    const { lab } = state;

    // Update URL with pushState
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('id', patientId);
    window.history.pushState({}, '', newUrl.toString());

    // Load patient files
    setState({ status: 'loading', lab, patientId });

    try {
      const files = await fetchPatientFiles(lab, patientId);
      setState({
        status: 'loaded',
        lab,
        patientId,
        config: labConfig || { title: 'مختبر التحاليل' },
        files,
      });
    } catch (error) {
      console.error('Failed to load patient files:', error);
      setState({
        status: 'error',
        lab,
        patientId,
        message: 'فشل في تحميل نتائج التحاليل. يرجى المحاولة مرة أخرى.',
      });
    }
  };

  // Handle file view
  const handleViewFile = async (file: PatientFile) => {
    if (state.status !== 'loaded') return;

    const { lab, patientId } = state;

    // Navigate to in-app viewer (viewer will also log access)
    const viewUrl = new URL(window.location.href);
    viewUrl.pathname = '/view';
    viewUrl.searchParams.set('lab', lab);
    viewUrl.searchParams.set('id', patientId);
    viewUrl.searchParams.set('fileId', file.fileId);
    viewUrl.searchParams.set('name', file.name);
    if (file.mimeType) viewUrl.searchParams.set('mime', file.mimeType);

    navigate(`${viewUrl.pathname}${viewUrl.search}`);
  };

  // Handle direct download from card (no open)
  const handleDownloadFile = async (file: PatientFile) => {
    if (state.status !== 'loaded') return;
    const { lab, patientId } = state;

    // Log as if view
    try {
      await logFileAccess(lab, patientId, file.fileId, file.name, 'view');
    } catch (error) {
      console.error('Failed to log file access:', error);
    }

    const url = getFileForcedDownloadUrl(lab, patientId, file.fileId);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Handle retry
  const handleRetry = () => {
    parseUrlAndLoad();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      {/* Header */}
      <PortalHeader
        config={labConfig}
        isLoading={isLoadingConfig && state.status !== 'missing-lab'}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {state.status === 'missing-lab' && (
          <ErrorState
            title="جار ظهور البيانات"
            message="إذا تأخر ظهور البيانات يرجى التأكد من إستخدام الرابط الصحيح للوصول إلى النتائج"
            variant="info"
          />
        )}

        {state.status === 'needs-patient-id' && (
          <PatientIdForm onSubmit={handlePatientIdSubmit} />
        )}

        {state.status === 'loading' && <LoadingSkeleton />}

        {state.status === 'loaded' && (
          <FileList files={state.files} onViewFile={handleViewFile} onDownloadFile={handleDownloadFile} />
        )}

        {state.status === 'error' && (
          <ErrorState
            title="حدث خطأ"
            message={state.message}
            onRetry={handleRetry}
          />
        )}
      </main>

      {/* Footer */}
      <PortalFooter />
    </div>
  );
}
