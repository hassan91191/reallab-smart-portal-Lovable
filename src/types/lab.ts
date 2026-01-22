export interface LabConfig {
  labKey: string;
  // Friendly lab name/title (derived from backend `title` if `labName` is not provided)
  labName: string;
  // Backward-compatible fields from backend
  title?: string;
  subtitle?: string;
  driveFolderId?: string;
  logSheetId?: string;
  logoFileId?: string;
  logoUrl?: string;
}

export interface ResultFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string | number;
  createdTime?: string;
  modifiedTime?: string;
  // Optional URLs (some backends may not provide them; actions use fileId + functions)
  downloadUrl?: string;
  viewUrl?: string;
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
