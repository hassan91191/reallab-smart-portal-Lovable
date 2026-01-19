import { PatientFile } from '@/types/portal';
import { FileText, Image, File, ExternalLink, Calendar, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FileCardProps {
  file: PatientFile;
  onView: (file: PatientFile) => void;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString?: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

function getFileType(file: PatientFile): { type: 'pdf' | 'image' | 'document'; label: string } {
  const mimeType = file.mimeType?.toLowerCase() || '';
  const fileName = file.name.toLowerCase();

  if (mimeType.includes('pdf') || fileName.endsWith('.pdf')) {
    return { type: 'pdf', label: 'PDF' };
  }
  if (mimeType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileName)) {
    return { type: 'image', label: 'صورة' };
  }
  return { type: 'document', label: 'مستند' };
}

function getFileIcon(type: 'pdf' | 'image' | 'document') {
  switch (type) {
    case 'pdf':
      return FileText;
    case 'image':
      return Image;
    default:
      return File;
  }
}

export function FileCard({ file, onView }: FileCardProps) {
  const fileType = getFileType(file);
  const FileIcon = getFileIcon(fileType.type);
  const formattedSize = formatFileSize(file.size);
  const formattedDate = formatDate(file.modifiedTime);

  return (
    <div className="medical-card rounded-xl p-4 group">
      <div className="flex items-start gap-4">
        {/* File Icon */}
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
            fileType.type === 'pdf'
              ? 'bg-destructive/10'
              : fileType.type === 'image'
              ? 'bg-primary/10'
              : 'bg-accent'
          }`}
        >
          <FileIcon
            className={`w-6 h-6 ${
              fileType.type === 'pdf'
                ? 'text-destructive'
                : fileType.type === 'image'
                ? 'text-primary'
                : 'text-accent-foreground'
            }`}
          />
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate mb-1" title={file.name}>
            {file.name}
          </h3>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge
              variant={fileType.type === 'pdf' ? 'pdf' : fileType.type === 'image' ? 'image' : 'document'}
            >
              {fileType.label}
            </Badge>

            {formattedSize && (
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3" />
                {formattedSize}
              </span>
            )}

            {formattedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formattedDate}
              </span>
            )}
          </div>
        </div>

        {/* View Button */}
        <Button
          onClick={() => onView(file)}
          size="sm"
          className="flex-shrink-0 gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity"
        >
          <span>عرض</span>
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
