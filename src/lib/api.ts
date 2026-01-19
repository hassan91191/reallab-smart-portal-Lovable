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
  
  return response.json();
}

export async function logFileAccess(
  lab: string,
  patientId: string,
  fileId: string,
  fileName: string
): Promise<void> {
  await fetch(`${BASE_URL}/log-access`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      lab,
      patientId,
      fileId,
      fileName,
      action: 'VIEW',
      userAgent: navigator.userAgent,
    }),
  });
}

export function getFileDownloadUrl(lab: string, patientId: string, fileId: string): string {
  return `${BASE_URL}/download-file?lab=${encodeURIComponent(lab)}&id=${encodeURIComponent(patientId)}&fileId=${encodeURIComponent(fileId)}`;
}
