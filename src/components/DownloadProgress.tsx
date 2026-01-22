import { motion } from 'framer-motion';
import { Loader2, Check, X } from 'lucide-react';

interface DownloadProgressProps {
  current: number;
  total: number;
  isComplete: boolean;
  isError?: boolean;
  onClose: () => void;
}

export function DownloadProgress({ current, total, isComplete, isError, onClose }: DownloadProgressProps) {
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <motion.div
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
    >
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isComplete ? (
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-400" />
              </div>
            ) : isError ? (
              <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                <X className="w-5 h-5 text-destructive" />
              </div>
            ) : (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            )}
            <div>
              <p className="text-foreground font-medium text-sm">
                {isComplete ? 'اكتمل التحميل' : isError ? 'فشل التحميل' : 'جار التحميل...'}
              </p>
              <p className="text-muted-foreground text-xs">
                {current} من {total} ملفات
              </p>
            </div>
          </div>
          {(isComplete || isError) && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${isError ? 'bg-destructive' : 'progress-bar'}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </motion.div>
  );
}
