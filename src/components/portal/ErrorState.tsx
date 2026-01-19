import { AlertCircle, RefreshCw, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  showLabIcon?: boolean;
}

export function ErrorState({ title, message, onRetry, showLabIcon }: ErrorStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-destructive/10 flex items-center justify-center border-2 border-destructive/20">
          {showLabIcon ? (
            <FlaskConical className="w-10 h-10 text-destructive" />
          ) : (
            <AlertCircle className="w-10 h-10 text-destructive" />
          )}
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          {title}
        </h2>
        <p className="text-muted-foreground mb-6">
          {message}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            إعادة المحاولة
          </Button>
        )}
      </div>
    </div>
  );
}
