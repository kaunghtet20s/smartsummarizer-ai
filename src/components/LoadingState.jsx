import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain } from 'lucide-react';

const MESSAGES = [
  'Reading your content…',
  'Extracting key points…',
  'Generating summary…',
  'Finalizing result…',
];

// Animated three-dot indicator.
function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-brand-500"
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}

// Shown while waiting for the first streamed token. Cycles through the progress
// messages and shows a shimmering skeleton card.
export default function LoadingState() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-5"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-soft">
          <motion.span
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            <Brain size={20} />
          </motion.span>
        </div>
        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="text-sm font-semibold text-slate-700 dark:text-slate-200"
            >
              {MESSAGES[index]}
            </motion.span>
          </AnimatePresence>
          <TypingDots />
        </div>
      </div>

      {/* Shimmering skeleton lines */}
      <div className="space-y-3">
        {[100, 92, 96, 70, 88, 60].map((w, i) => (
          <div
            key={i}
            className="relative h-3.5 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/5"
            style={{ width: `${w}%` }}
          >
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/10" />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
