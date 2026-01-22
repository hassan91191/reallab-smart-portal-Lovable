import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


// Convert raw Drive/export filenames into a human-friendly title.
// - removes extensions (pdf/jpg/png...)
// - removes trailing numeric-only tokens (patient ids, page numbers)
// - removes "page" markers
// - keeps mixed alphanumeric tokens like HbA1C
export function prettifyFileName(raw: string): string {
  if (!raw) return '';
  let s = String(raw);

  // Remove common suffix patterns like _<patientId> (digits only)
  s = s.replace(/_(\d{6,})$/g, '');

  // Remove extensions
  s = s.replace(/\.(pdf|png|jpe?g|webp|gif|tiff?)$/i, '');

  // Remove 'page' markers and adjacent numbers (page_001, _page-2, etc.)
  s = s.replace(/(?:^|[\s_\-])page(?:[\s_\-]*)(\d+)?/gi, ' ');

  // Replace underscores/hyphens with spaces
  s = s.replace(/[\_\-]+/g, ' ');

  // Remove tokens that are only digits (but keep mixed tokens like HbA1C)
  s = s.replace(/\b\d+\b/g, ' ');

  // Collapse spaces
  s = s.replace(/\s{2,}/g, ' ').trim();

  return s;
}
