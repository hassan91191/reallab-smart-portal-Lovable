import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <motion.footer
      className="py-6 mt-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
    >
      <div
        className="flex items-center justify-center gap-2 text-muted-foreground text-sm"
        style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
      >
        <Sparkles className="w-4 h-4 text-primary/60" />
        <span className="whitespace-nowrap">
          <span>Powered by </span>
          <span className="font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            HAMA co. Smart Portal
          </span>
        </span>
      </div>
    </motion.footer>
  );
}
