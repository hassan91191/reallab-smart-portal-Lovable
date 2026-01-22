import { motion } from 'framer-motion';

interface SkeletonCardProps {
  count?: number;
}

export function SkeletonCard({ count = 1 }: SkeletonCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="glass-card rounded-2xl p-5 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="shimmer h-5 w-3/4 rounded-lg" />
              <div className="shimmer h-3 w-1/2 rounded-lg" />
            </div>
            <div className="shimmer h-10 w-10 rounded-xl" />
          </div>
          <div className="flex gap-2 pt-2">
            <div className="shimmer h-9 flex-1 rounded-xl" />
            <div className="shimmer h-9 flex-1 rounded-xl" />
          </div>
        </motion.div>
      ))}
    </>
  );
}
