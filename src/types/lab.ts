export interface LabConfig {
  labKey: string;
  // Friendly lab name/title (derived from backend `title` if `labName` is not provided)
  labName: string;

  // Backward-compatible fields from backend
  title?: string;
  subtitle?: string;

  driveFolderId?: string;
  logSheetId?: string;

  // Logo fields
  logoFileId?: string;
  // Optional: returned by backend to support cache-busting (e.g. Logo_yyyyMMdd_HHmmss.png)
  logoFileName?: string;
  // May be relative (/.netlify/functions/...) or absolute
  logoUrl?: string;
}

export interface ResultFile {
  id: string;
  name: string;
  mimeType: string;

  // Optional metadata
  size?: string | number;
  modifiedTime?: string;

  // Convenience URLs created by the frontend API client
  viewUrl?: string;
  downloadUrl?: string;
}

export interface PatientFilesResponse {
  files: ResultFile[];
  blocked?: boolean;
  amount?: number;
  markerFileId?: string;
  markerFileName?: string;
}

export type FileType = 'image' | 'pdf' | 'unknown';

export function getFileType(mimeType: string): FileType {
  if (mimeType?.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'unknown';
}

export function isImage(file: ResultFile): boolean {
  return getFileType(file.mimeType) === 'image';
}

export function isPdf(file: ResultFile): boolean {
  return getFileType(file.mimeType) === 'pdf';
}
