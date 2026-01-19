import { FlaskConical } from 'lucide-react';

export function PortalFooter() {
  return (
    <footer className="bg-card border-t border-border py-4 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <FlaskConical className="w-4 h-4 text-primary" />
          <span>Powered by</span>
          <span className="font-medium text-foreground">Real Lab Smart Portal</span>
        </div>
      </div>
    </footer>
  );
}
