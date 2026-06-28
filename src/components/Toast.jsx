import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

// Lightweight toast system: a provider, a `useToast()` hook and the animated
// stack that renders in the corner.

const ToastContext = createContext(() => {});

export const useToast = () => useContext(ToastContext);

const ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const ACCENTS = {
  success: 'text-emerald-500',
  error: 'text-rose-500',
  info: 'text-brand-500',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, type = 'info', duration = 3500) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);
      window.setTimeout(() => remove(id), duration);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end">
        <AnimatePresence>
          {toasts.map(({ id, message, type }) => {
            const Icon = ICONS[type] || Info;
            return (
              <motion.div
                key={id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                className="glass pointer-events-auto flex w-full max-w-sm items-start gap-3 px-4 py-3"
              >
                <Icon size={20} className={`mt-0.5 shrink-0 ${ACCENTS[type]}`} />
                <p className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-100">
                  {message}
                </p>
                <button
                  onClick={() => remove(id)}
                  className="text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-white"
                  aria-label="Dismiss notification"
                >
                  <X size={16} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
