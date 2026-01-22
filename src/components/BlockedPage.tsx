import { motion } from 'framer-motion';
import { LabHeader } from '@/components/LabHeader';
import { Footer } from '@/components/Footer';
import type { LabConfig } from '@/types/lab';

interface BlockedPageProps {
  labConfig: LabConfig | null;
  amount: number;
}

export function BlockedPage({ labConfig, amount }: BlockedPageProps) {
  const safeAmount = Number.isFinite(amount) ? Math.round(amount) : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-10 flex-1 w-full max-w-3xl">
        <LabHeader labConfig={labConfig} />

        <motion.div
          className="mt-10 glass-card glow-ring rounded-3xl p-6 md:p-8 text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            النتائج محجوبة
          </h1>
          <p className="text-muted-foreground leading-relaxed mb-3">
            عذرًا.. النتائج محجوبة لوجود باقي حساب مستحق قدره <span className="text-foreground font-semibold">{safeAmount}</span>
          </p>
          <p className="text-muted-foreground leading-relaxed">
            برجاء التواصل مع المعمل و سداد المبلغ المستحق بأحد وسائل الدفع المتاحة لظهور النتائج
          </p>
        </motion.div>

        <Footer />
      </div>
    </div>
  );
}
