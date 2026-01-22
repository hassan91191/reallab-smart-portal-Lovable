import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, ArrowLeft, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Footer } from '@/components/Footer';
import { LabHeader } from '@/components/LabHeader';
import type { LabConfig } from '@/types/lab';

interface PatientIdInputProps {
  labConfig: LabConfig | null;
  onSubmit: (patientId: string) => void;
  isLoading?: boolean;
}

export function PatientIdInput({ labConfig, onSubmit, isLoading }: PatientIdInputProps) {
  const [patientId, setPatientId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (patientId.trim()) {
      onSubmit(patientId.trim());
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container max-w-lg mx-auto flex-1 flex flex-col">
        <LabHeader labConfig={labConfig} />

        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <motion.div 
            className="glass-card rounded-3xl p-6 md:p-8 w-full space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Icon */}
            <motion.div 
              className="flex justify-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl" />
                <div className="relative glass-card w-16 h-16 rounded-2xl flex items-center justify-center">
                  <Fingerprint className="w-8 h-8 text-primary" />
                </div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.div 
              className="text-center space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-xl md:text-2xl font-bold text-foreground">
                أدخل رقم الملف
              </h2>
              <p className="text-muted-foreground text-sm">
                للوصول إلى نتائج التحاليل الخاصة بك
              </p>
            </motion.div>

            {/* Form */}
            <motion.form 
              onSubmit={handleSubmit}
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="relative">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="رقم الملف أو الهوية"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="h-14 pr-12 text-lg bg-muted/50 border-border/50 rounded-xl 
                             focus:ring-2 focus:ring-primary/30 focus:border-primary/50
                             placeholder:text-muted-foreground/50"
                  dir="rtl"
                />
              </div>

              <Button
                type="submit"
                disabled={!patientId.trim() || isLoading}
                className="w-full h-14 text-lg font-semibold rounded-xl
                           bg-gradient-to-r from-primary to-primary-glow
                           hover:opacity-90 transition-opacity
                           disabled:opacity-50 disabled:cursor-not-allowed
                           shadow-glow"
              >
                {isLoading ? (
                  <motion.div
                    className="w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <>
                    <span>عرض النتائج</span>
                    <ArrowLeft className="w-5 h-5 mr-2" />
                  </>
                )}
              </Button>
            </motion.form>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
