import { motion } from 'framer-motion';
import { FileText, Image, Eye, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ResultFile } from '@/types/lab';
import { isImage, isPdf } from '@/types/lab';

interface ResultCardProps {
  file: ResultFile;
  index: number;
  onView: () => void;
  onDownload: () => void;
}

export function ResultCard({ file, index, onView, onDownload }: ResultCardProps) {
  const FileIcon = isImage(file) ? Image : FileText;
  const iconColor = isImage(file) ? 'text-emerald-400' : 'text-primary';
  const iconBg = isImage(file) ? 'from-emerald-500/20 to-emerald-500/5' : 'from-primary/20 to-primary/5';

  // Format date if available
  const formattedDate = file.createdTime 
    ? new Date(file.createdTime).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <motion.div 
      className="glass-card glow-ring rounded-2xl p-5 space-y-4 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -2 }}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center`}>
          <FileIcon className={`w-6 h-6 ${iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="font-semibold text-foreground truncate">
            {file.name}
          </h3>
          {formattedDate && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onView}
          className="flex-1 h-10 rounded-xl border-border/50 bg-muted/30
                     hover:bg-primary/10 hover:border-primary/30 hover:text-primary
                     transition-all duration-200"
        >
          <Eye className="w-4 h-4 ml-2" />
          عرض
        </Button>
        <Button
          variant="outline"
          onClick={onDownload}
          className="flex-1 h-10 rounded-xl border-border/50 bg-muted/30
                     hover:bg-accent/10 hover:border-accent/30 hover:text-accent
                     transition-all duration-200"
        >
          <Download className="w-4 h-4 ml-2" />
          تحميل
        </Button>
      </div>
    </motion.div>
  );
}
