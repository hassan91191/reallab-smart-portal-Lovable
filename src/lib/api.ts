import type { LabConfig, ResultFile } from '@/types/lab';
import { mockLabConfig, mockFiles } from './mockData';

const API_BASE = import.meta.env.VITE_API_BASE || '/.netlify/functions';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'; // default false

export async function getLabConfig(labKey: string): Promise<LabConfig> {
  if (USE_MOCK) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    if (labKey) {
      return { ...mockLabConfig, labKey };
    }
    throw new Error('Invalid lab key');
  }

  const response = await fetch(`${API_BASE}/get-lab-config?lab=${encodeURIComponent(labKey)}`);
  
  if (!response.ok) {
    throw new Error('فشل في تحميل بيانات المختبر');
  }
  
  const data = await response.json();
  return {
    ...data,
    labKey: data.labKey ?? labKey,
    labName: data.labName ?? data.title ?? data.labName ?? 'نتائج التحاليل الطبية',
  };
}

export async function getPatientFiles(labKey: string, patientId: string): Promise<ResultFile[]> {
  if (USE_MOCK) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    if (labKey && patientId) {
      return mockFiles;
    }
    throw new Error('Invalid parameters');
  }

  const response = await fetch(
    `${API_BASE}/get-files?lab=${encodeURIComponent(labKey)}&id=${encodeURIComponent(patientId)}`
  );
  
  if (!response.ok) {
    throw new Error('فشل في تحميل النتائج');
  }
  
  const data = await response.json();
  const rawFiles = (data?.files ?? data) as any[];

  const withUrls: ResultFile[] = (rawFiles || []).map((f: any) => {
    const id = f.id ?? f.fileId ?? f.file_id;
    const name = f.name ?? f.fileName ?? f.filename ?? String(id);
    const mimeType = f.mimeType ?? f.mime_type ?? 'application/octet-stream';

    const base = API_BASE;
    const common = `lab=${encodeURIComponent(labKey)}&id=${encodeURIComponent(patientId)}&fileId=${encodeURIComponent(id)}`;
    return {
      id,
      name,
      mimeType,
      size: f.size,
      modifiedTime: f.modifiedTime ?? f.modified_time,
      // inline view (PDF/image) in viewers
      viewUrl: `${base}/download-file?${common}`,
      // force attachment for direct download
      downloadUrl: `${base}/download-file?${common}&download=1`,
    };
  });

  return withUrls;
}

export async function downloadFile(labKey: string, patientId: string, fileId: string): Promise<Blob> {
  if (USE_MOCK) {
    // Find the file and fetch it
    const file = mockFiles.find(f => f.id === fileId);
    if (file) {
      const response = await fetch(file.downloadUrl);
      return response.blob();
    }
    throw new Error('File not found');
  }

  const response = await fetch(
    `${API_BASE}/download-file?lab=${encodeURIComponent(labKey)}&id=${encodeURIComponent(patientId)}&fileId=${encodeURIComponent(fileId)}`
  );
  
  if (!response.ok) {
    throw new Error('فشل في تحميل الملف');
  }
  
  return response.blob();
}

export async function logAccess(labKey: string, patientId: string, fileId: string, action: 'view' | 'download'): Promise<void> {
  if (USE_MOCK) {
    console.log(`[Log Access] ${action}: lab=${labKey}, patient=${patientId}, file=${fileId}`);
    return;
  }

  try {
    await fetch(`${API_BASE}/log-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lab: labKey,
        patientId,
        fileId,
        action,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Failed to log access:', error);
  }
}

// Logo caching utilities
const LOGO_CACHE_PREFIX = 'lab_logo_cache_';

export function getCachedLogo(labKey: string): string | null {
  try {
    const cached = localStorage.getItem(`${LOGO_CACHE_PREFIX}${labKey}`);
    if (cached) {
      const { url, timestamp } = JSON.parse(cached);
      // Cache for 24 hours
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        return url;
      }
    }
  } catch {
    // Ignore cache errors
  }
  return null;
}

export function cacheLogo(labKey: string, url: string): void {
  try {
    localStorage.setItem(
      `${LOGO_CACHE_PREFIX}${labKey}`,
      JSON.stringify({ url, timestamp: Date.now() })
    );
  } catch {
    // Ignore cache errors
  }
}
