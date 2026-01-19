import { LabConfig } from '@/types/portal';
import { FlaskConical } from 'lucide-react';

interface PortalHeaderProps {
  config?: LabConfig;
  isLoading?: boolean;
}

export function PortalHeader({ config, isLoading }: PortalHeaderProps) {
  return (
    <header className="bg-card border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            {isLoading ? (
              <div className="w-14 h-14 rounded-lg skeleton-pulse" />
            ) : config?.logoUrl ? (
              <img
                src={config.logoUrl}
                alt={config.title || 'Lab Logo'}
                className="w-14 h-14 object-contain rounded-lg border border-border"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <FlaskConical className="w-7 h-7 text-primary" />
              </div>
            )}
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <>
                <div className="h-6 w-48 skeleton-pulse rounded mb-2" />
                <div className="h-4 w-32 skeleton-pulse rounded" />
              </>
            ) : (
              <>
                <h1 className="text-xl font-semibold text-foreground truncate">
                  {config?.title || 'مختبر التحاليل'}
                </h1>
                {config?.subtitle && (
                  <p className="text-sm text-muted-foreground truncate">
                    {config.subtitle}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
