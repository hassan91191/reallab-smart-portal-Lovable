import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, ArrowLeft, FileSearch } from 'lucide-react';

interface PatientIdFormProps {
  onSubmit: (patientId: string) => void;
  isLoading?: boolean;
}

export function PatientIdForm({ onSubmit, isLoading }: PatientIdFormProps) {
  const [patientId, setPatientId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (patientId.trim()) {
      onSubmit(patientId.trim());
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
            <FileSearch className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            عرض نتائج التحاليل
          </h2>
          <p className="text-muted-foreground">
            أدخل رقم المريض للوصول إلى نتائج التحاليل الخاصة بك
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="رقم المريض"
              className="ps-12 pe-4 h-14 text-lg bg-card border-2 border-border focus:border-primary transition-colors"
              dir="ltr"
              disabled={isLoading}
              autoFocus
            />
          </div>

          <Button
            type="submit"
            className="w-full h-14 text-lg font-medium gap-2"
            disabled={!patientId.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                جاري البحث...
              </>
            ) : (
              <>
                عرض النتائج
                <ArrowLeft className="w-5 h-5" />
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          رقم المريض موجود في إيصال الاستلام
        </p>
      </div>
    </div>
  );
}
