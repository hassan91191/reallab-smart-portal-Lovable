// Mock data for development/demo purposes
import type { LabConfig, ResultFile } from '@/types/lab';

export const mockLabConfig: LabConfig = {
  labKey: 'demo',
  labName: 'مختبر الرعاية الصحية',
  driveFolderId: 'mock-folder-id',
  logoUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=200&h=200&fit=crop',
};

export const mockFiles: ResultFile[] = [
  {
    id: '1',
    name: 'تحليل الدم الشامل CBC',
    mimeType: 'application/pdf',
    createdTime: '2024-01-15T10:30:00Z',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    viewUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: '2',
    name: 'تحليل وظائف الكلى',
    mimeType: 'application/pdf',
    createdTime: '2024-01-15T11:00:00Z',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    viewUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: '3',
    name: 'صورة الأشعة السينية',
    mimeType: 'image/jpeg',
    createdTime: '2024-01-14T09:15:00Z',
    downloadUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800',
    viewUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800',
  },
  {
    id: '4',
    name: 'تحليل البول الكامل',
    mimeType: 'image/png',
    createdTime: '2024-01-13T14:45:00Z',
    downloadUrl: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=800',
    viewUrl: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=800',
  },
  {
    id: '5',
    name: 'تحليل السكر التراكمي HbA1c',
    mimeType: 'application/pdf',
    createdTime: '2024-01-12T08:30:00Z',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    viewUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
];
