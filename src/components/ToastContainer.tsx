import { m, AnimatePresence } from 'motion/react';
import type { Toast } from '../types';

interface Props {
  toasts: Toast[];
  onUndo: (toast: Toast) => void;
}

export default function ToastContainer({ toasts, onUndo }: Props) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 max-sm:bottom-[5.5rem] max-sm:px-4 safe-area-inset-bottom sm:w-auto sm:min-w-[320px]" role="region" aria-live="polite" aria-label="Notifications">
      <AnimatePresence>
        {toasts.map(t => (
          <m.div
            key={t.id}
            className="flex items-center gap-3 bg-surface border border-border rounded-[var(--radius-md)] px-4 py-3 shadow-lg text-sm text-text"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <span className="flex-1">{t.message}</span>
            {t.undoHandler && (
              <button className="text-xs font-bold text-primary bg-transparent border-none cursor-pointer hover:text-primary-dark whitespace-nowrap touch-target" onClick={() => onUndo(t)} aria-label={`Undo: ${t.message}`}>Undo</button>
            )}
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
