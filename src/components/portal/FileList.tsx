import { useState, useMemo } from 'react';
import { PatientFile } from '@/types/portal';
import { FileCard } from './FileCard';
import { Input } from '@/components/ui/input';
import { Search, FileX, Files } from 'lucide-react';

interface FileListProps {
  files: PatientFile[];
  onViewFile: (file: PatientFile) => void;
}

export function FileList({ files, onViewFile }: FileListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const sortedAndFilteredFiles = useMemo(() => {
    // Filter by search query
    const filtered = files.filter((file) =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort: newest first (by modifiedTime), then alphabetically
    return filtered.sort((a, b) => {
      if (a.modifiedTime && b.modifiedTime) {
        return new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime();
      }
      if (a.modifiedTime) return -1;
      if (b.modifiedTime) return 1;
      return a.name.localeCompare(b.name, 'ar');
    });
  }, [files, searchQuery]);

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
    <div className="flex-1 p-4 md:p-6">
      {/* Search and Stats Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Files className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">نتائج التحاليل</h2>
            <p className="text-sm text-muted-foreground">
              {files.length} {files.length === 1 ? 'ملف' : 'ملفات'}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="البحث في الملفات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-10 pe-4 bg-card"
          />
        </div>
      </div>

      {/* File Grid */}
      {sortedAndFilteredFiles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            لا توجد نتائج للبحث "{searchQuery}"
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedAndFilteredFiles.map((file) => (
            <FileCard key={file.fileId} file={file} onView={onViewFile} />
          ))}
        </div>
      )}
    </div>
  );
}
