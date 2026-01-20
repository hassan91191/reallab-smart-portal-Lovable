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

export function getFileDownloadUrl(lab: string, patientId: string, fileId: string): string {
  return `${BASE_URL}/download-file?lab=${encodeURIComponent(lab)}&id=${encodeURIComponent(patientId)}&fileId=${encodeURIComponent(fileId)}`;
}
