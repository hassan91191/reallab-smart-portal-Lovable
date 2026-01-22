import { motion } from 'framer-motion';
import { AlertCircle, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/Footer';

interface StatusScreenProps {
  type: 'missing-lab' | 'error';
  onRetry?: () => void;
}

export function StatusScreen({ type, onRetry }: StatusScreenProps) {
  const content = {
    'missing-lab': {
      icon: WifiOff,
      title: 'جار ظهور البيانات',
      subtitle: 'إذا تأخر ظهور البيانات يرجى التأكد من استخدام الرابط الصحيح للوصول إلى النتائج',
      showRetry: false,
    },
    'error': {
      icon: AlertCircle,
      title: 'حدث خطأ',
      subtitle: 'يرجى المحاولة مرة أخرى أو التواصل مع المختبر',
      showRetry: true,
    },
  };

  const { icon: Icon, title, subtitle, showRetry } = content[type];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div 
          className="glass-card rounded-3xl p-8 md:p-12 max-w-md w-full text-center space-y-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Icon with glow */}
          <motion.div 
            className="relative mx-auto w-24 h-24 flex items-center justify-center"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 blur-xl" />
            <div className="relative glass-card w-20 h-20 rounded-2xl flex items-center justify-center">
              <Icon className="w-10 h-10 text-primary" />
            </div>
          </motion.div>

          {/* Text content */}
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {title}
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              {subtitle}
            </p>
          </motion.div>

          {/* Retry button */}
          {showRetry && onRetry && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button 
                onClick={onRetry}
                variant="outline"
                className="gap-2 border-primary/30 hover:bg-primary/10 hover:border-primary/50"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة المحاولة
              </Button>
            </motion.div>
          )}

          {/* Decorative elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-primary/5 to-transparent rotate-12" />
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
