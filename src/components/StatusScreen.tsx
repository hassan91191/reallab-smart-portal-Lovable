import { motion } from 'framer-motion';
import { AlertCircle, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/Footer';

interface StatusScreenProps {
  type: 'missing-lab' | 'error';
  onRetry?: () => void;
  title?: string;
  subtitle?: string;
}

export function StatusScreen({ type, onRetry, title: titleOverride, subtitle: subtitleOverride }: StatusScreenProps) {
  const content = {
    'missing-lab': {
      icon: WifiOff,
      title: 'جار ظهور البيانات',
      subtitle: 'إذا تأخر ظهور البيانات يرجى التأكد من استخدام الرابط الصحيح للوصول إلى النتائج',
      buttonText: 'إعادة المحاولة',
      showRetry: true,
    },
    'error': {
      icon: AlertCircle,
      title: 'حدث خطأ',
      subtitle: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
      buttonText: 'إعادة المحاولة',
      showRetry: true,
    },
  } as const;

  const { icon: Icon, title, subtitle, buttonText, showRetry } = content[type];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background pointer-events-none" />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center">
        <motion.div
          className="w-24 h-24 rounded-2xl glass-card glow-ring flex items-center justify-center mb-8"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Icon className="w-10 h-10 text-primary" />
        </motion.div>

        <motion.div
          className="max-w-md space-y-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {titleOverride || title}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {subtitleOverride || subtitle}
          </p>
        </motion.div>

        {showRetry && onRetry && (
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.45 }}
          >
            <Button
              onClick={onRetry}
              className="h-12 px-8 rounded-2xl bg-gradient-to-r from-primary to-accent hover:opacity-90 gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {buttonText}
            </Button>
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
}
