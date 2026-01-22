import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { getLabConfig, getPatientFiles } from '@/lib/api';
import type { LabConfig, ResultFile } from '@/types/lab';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { StatusScreen } from '@/components/StatusScreen';
import { PatientIdInput } from '@/components/PatientIdInput';
import { ResultsPage } from '@/components/ResultsPage';

type PageState = 'loading' | 'missing-lab' | 'missing-id' | 'loading-results' | 'results' | 'error';

const LabPortal = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const labKey = searchParams.get('lab');
  const patientId = searchParams.get('id');

  const [pageState, setPageState] = useState<PageState>('loading');
  const [labConfig, setLabConfig] = useState<LabConfig | null>(null);
  const [files, setFiles] = useState<ResultFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load lab config
  useEffect(() => {
    if (!labKey) {
      setPageState('missing-lab');
      return;
    }

    const loadLabConfig = async () => {
      try {
        setPageState('loading');
        const config = await getLabConfig(labKey);
        setLabConfig(config);
        
        if (!patientId) {
          setPageState('missing-id');
        } else {
          setPageState('loading-results');
        }
      } catch (err) {
        console.error('Failed to load lab config:', err);
        setPageState('missing-lab');
      }
    };

    loadLabConfig();
  }, [labKey, patientId]);

  // Load patient files
  useEffect(() => {
    if (pageState !== 'loading-results' || !labKey || !patientId) return;

    const loadFiles = async () => {
      try {
        const patientFiles = await getPatientFiles(labKey, patientId);
        setFiles(patientFiles);
        setPageState('results');
      } catch (err) {
        console.error('Failed to load files:', err);
        setError('فشل في تحميل النتائج');
        setPageState('error');
      }
    };

    loadFiles();
  }, [pageState, labKey, patientId]);

  const handlePatientIdSubmit = useCallback((id: string) => {
    setSearchParams({ lab: labKey!, id });
  }, [labKey, setSearchParams]);

  const handleRetry = useCallback(() => {
    setPageState('loading');
    window.location.reload();
  }, []);

  // Update document title
  useEffect(() => {
    document.title = labConfig?.labName 
      ? `${labConfig.labName} - نتائج التحاليل`
      : 'بوابة نتائج التحاليل الذكية';
  }, [labConfig?.labName]);

  return (
    <AnimatePresence mode="wait">
      {pageState === 'loading' && (
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner text="جار تحميل البيانات..." size="lg" />
        </div>
      )}

      {pageState === 'missing-lab' && (
        <StatusScreen type="missing-lab" />
      )}

      {pageState === 'missing-id' && (
        <PatientIdInput 
          labConfig={labConfig} 
          onSubmit={handlePatientIdSubmit}
        />
      )}

      {pageState === 'loading-results' && (
        <div className="min-h-screen flex flex-col">
          <div className="container max-w-2xl mx-auto flex-1 flex flex-col px-4">
            <div className="py-8" />
            <div className="flex-1 flex items-center justify-center">
              <LoadingSpinner text="جار تحميل النتائج..." size="lg" />
            </div>
          </div>
        </div>
      )}

      {pageState === 'results' && labConfig && patientId && (
        <ResultsPage 
          labConfig={labConfig} 
          patientId={patientId} 
          files={files}
        />
      )}

      {pageState === 'error' && (
        <StatusScreen type="error" onRetry={handleRetry} />
      )}
    </AnimatePresence>
  );
};

export default LabPortal;
