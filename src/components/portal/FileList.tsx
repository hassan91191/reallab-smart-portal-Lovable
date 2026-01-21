import { useMemo } from 'react';
import { PatientFile } from '@/types/portal';
import { FileCard } from './FileCard';
import { FileX } from 'lucide-react';

interface FileListProps {
  files: PatientFile[];
  onViewFile: (file: PatientFile) => void;
  onDownloadFile: (file: PatientFile) => void;
}

export function FileList({ files, onViewFile, onDownloadFile }: FileListProps) {
  const sortedFiles = useMemo(() => {
    // Sort: newest first (by modifiedTime), then alphabetically
    return [...files].sort((a, b) => {
      if (a.modifiedTime && b.modifiedTime) {
        return new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime();
      }
      if (a.modifiedTime) return -1;
      if (b.modifiedTime) return 1;
      return a.name.localeCompare(b.name, 'ar');
    });
  }, [files]);

  if (files.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
            <FileX className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium text-foreground mb-2">
            لا توجد نتائج
          </h3>
          <p className="text-muted-foreground">
            لم يتم العثور على ملفات لهذا المريض
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 pb-10">
      <div className="max-w-5xl mx-auto">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {sortedFiles.map((file) => (
            <FileCard key={file.fileId} file={file} onView={onViewFile} onDownload={onDownloadFile} />
          ))}
        </div>
      </div>
    </div>
  );
}
