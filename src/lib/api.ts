import { LabConfig, PatientFile } from '@/types/portal';

const BASE_URL = '/.netlify/functions';

export async function fetchLabConfig(lab: string): Promise<LabConfig> {
  const response = await fetch(`${BASE_URL}/get-lab-config?lab=${encodeURIComponent(lab)}`);

  if (!response.ok) {
    throw new Error('فشل في تحميل إعدادات المختبر');
  }

  return response.json();
}

export async function fetchPatientFiles(lab: string, patientId: string): Promise<PatientFile[]> {
  const response = await fetch(
    `${BASE_URL}/get-files?lab=${encodeURIComponent(lab)}&id=${encodeURIComponent(patientId)}`
  );

  if (!response.ok) {
    throw new Error('فشل في تحميل ملفات المريض');
  }

  const data = await response.json();

  // Netlify returns: { files: [{ id, name, ... }], ... }
  const files = Array.isArray(data?.files) ? data.files : [];

  return files.map((f: any) => ({
    fileId: String(f.id || ''),
    name: String(f.name || ''),
    mimeType: f.mimeType,
    size: f.size ? Number(f.size) : undefined,
    modifiedTime: f.modifiedTime,
  }));
}

export async function logFileAccess(
  lab: string,
  patientId: string,
  fileId: string,
  fileName: string,
  action: 'view' | 'download' | string = 'view',
  userAgent?: string
): Promise<void> {
  const payload = {
    lab,
    id: patientId,
    fileId,
    fileName,
    action,
    userAgent: userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
    at: new Date().toISOString(),
  };

  const res = await fetch(`${BASE_URL}/log-access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  // ما نوقعش الموقع لو اللوج فشل
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.warn('log-access failed', res.status, txt);
  }
}

export function getFileDownloadUrl(lab: string, patientId: string, fileId: string): string {
  return `${BASE_URL}/download-file?lab=${encodeURIComponent(lab)}&id=${encodeURIComponent(
    patientId
  )}&fileId=${encodeURIComponent(fileId)}`;
}

export function getFileForcedDownloadUrl(lab: string, patientId: string, fileId: string): string {
  return `${getFileDownloadUrl(lab, patientId, fileId)}&download=1`;
}

export function getLogoUrl(lab: string, fileId: string): string {
  return `${BASE_URL}/download-file?lab=${encodeURIComponent(lab)}&fileId=${encodeURIComponent(fileId)}&logo=1`;
}
