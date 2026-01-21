import { DnaIcon } from '@/components/icons/DnaIcon';

export function PortalFooter() {
  return (
    <footer className="py-10 mt-auto">
      <div className="flex items-center justify-center">
        <div className="bg-card border border-border shadow-sm rounded-full px-6 py-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Powered by</span>
          <span className="font-medium text-foreground">HAMA co. Smart Portal</span>
          <DnaIcon className="w-4 h-4 text-primary" />
        </div>
      </div>
    </footer>
  );
}
