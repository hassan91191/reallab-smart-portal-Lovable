import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <motion.footer 
      className="py-6 mt-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
    >
      <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
        <Sparkles className="w-4 h-4 text-primary/60" />
        <span>Powered by</span>
        <span className="font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          HAMA co. Smart Portal
        </span>
      </div>
    </motion.footer>
  );
}
