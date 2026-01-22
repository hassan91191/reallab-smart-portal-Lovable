import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { getCachedLogo, cacheLogo } from '@/lib/api';
import type { LabConfig } from '@/types/lab';

interface LabHeaderProps {
  labConfig: LabConfig | null;
}

export function LabHeader({ labConfig }: LabHeaderProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (!labConfig?.labKey) return;

    // Check cache first
    const cached = getCachedLogo(labConfig.labKey);
    if (cached) {
      setLogoUrl(cached);
      return;
    }

    // Use logoUrl from config if available
    if (labConfig.logoUrl) {
      setLogoUrl(labConfig.logoUrl);
      cacheLogo(labConfig.labKey, labConfig.logoUrl);
    }
  }, [labConfig]);

  return (
    <motion.header 
      className="relative py-8 md:py-12"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Glow effect behind logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-6">
        {/* Logo Container */}
        <motion.div 
          className="relative"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="glass-card p-6 md:p-8 rounded-3xl logo-glow pulse-glow">
            {logoUrl && !logoError ? (
              <img
                src={logoUrl}
                alt={labConfig?.labName || 'شعار المختبر'}
                className="h-40 w-40 md:h-48 md:w-48 object-cover rounded-2xl"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="h-40 w-40 md:h-48 md:w-48 flex items-center justify-center">
                <svg 
                  className="w-24 h-24 md:w-28 md:h-28 text-primary/60"
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5"
                >
                  <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0-6v6" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
            )}
          </div>
        </motion.div>
</div>
    </motion.header>
  );
}
