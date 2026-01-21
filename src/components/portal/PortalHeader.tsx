import { LabConfig } from '@/types/portal';
import { DnaIcon } from '@/components/icons/DnaIcon';

interface PortalHeaderProps {
  config?: LabConfig;
  isLoading?: boolean;
}

export function PortalHeader({ config, isLoading }: PortalHeaderProps) {
  return (
    <header className="pt-6 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-card border border-border rounded-3xl shadow-lg p-6 sm:p-8">
          <div className="flex flex-col items-center text-center gap-4">
            {/* Logo (always centered) */}
            {isLoading ? (
              <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-3xl skeleton-pulse" />
            ) : config?.logoUrl ? (
              <img
                src={config.logoUrl}
                alt="Lab Logo"
                className="w-40 h-40 sm:w-48 sm:h-48 object-cover rounded-3xl shadow-sm"
              />
            ) : (
              <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <DnaIcon className="w-20 h-20 text-primary" />
              </div>
            )}

            {/* Single title only (no duplicated subtitle) */}
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              نتائج التحاليل الطبية
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
}
