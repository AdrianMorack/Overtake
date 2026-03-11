import { motion } from 'motion/react';

export function LiveBadge() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/20 border border-red-600 rounded">
      <motion.div
        className="w-2 h-2 bg-red-600 rounded-full"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <span className="text-xs uppercase tracking-wider text-red-600 telemetry-text">LIVE</span>
    </div>
  );
}
