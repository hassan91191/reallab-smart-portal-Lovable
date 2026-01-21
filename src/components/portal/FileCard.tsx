import { PatientFile } from '@/types/portal';
import { FileText, Image, File, ExternalLink, Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileCardProps {
  file: PatientFile;
  onView: (file: PatientFile) => void;
  onDownload: (file: PatientFile) => void;
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

export function FileCard({ file, onView, onDownload }: FileCardProps) {
  const fileType = getFileType(file);
  const FileIcon = getFileIcon(fileType.type);
  const formattedDate = formatDate(file.modifiedTime);

  return (
    <div className="medical-card rounded-2xl p-4 bg-card group">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white border border-border shadow-sm flex items-center justify-center">
          <FileIcon className="w-7 h-7 text-foreground/80" />
        </div>

        {/* Name + Meta */}
        <div className="flex-1 min-w-0 text-start">
          <h3 className="font-semibold text-foreground truncate" title={file.name}>
            {file.name}
          </h3>
          {formattedDate && (
            <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button onClick={() => onView(file)} variant="outline" className="gap-2 rounded-xl">
          <ExternalLink className="w-4 h-4" />
          عرض
        </Button>
        <Button onClick={() => onDownload(file)} className="gap-2 rounded-xl">
          <Download className="w-4 h-4" />
          تحميل
        </Button>
      </div>
    </div>
  );
}
