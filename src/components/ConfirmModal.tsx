import { useRef, useEffect } from 'react';

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: string;
}

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function ConfirmModal({ title, message, confirmLabel, cancelLabel, onConfirm, onCancel, variant }: Props) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    lastFocused.current = document.activeElement as HTMLElement;
    const focusable = overlay.querySelectorAll<HTMLElement>(FOCUSABLE);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const trap = (e: Event) => {
      const ke = e as KeyboardEvent;
      if (ke.key === 'Escape') { onCancel(); return; }
      if (ke.key !== 'Tab') return;
      if (ke.shiftKey && document.activeElement === first) {
        ke.preventDefault();
        last?.focus();
      } else if (!ke.shiftKey && document.activeElement === last) {
        ke.preventDefault();
        first?.focus();
      }
    };
    overlay.addEventListener('keydown', trap);
    return () => {
      overlay.removeEventListener('keydown', trap);
      if (lastFocused.current && document.body.contains(lastFocused.current)) {
        lastFocused.current.focus();
      }
    };
  }, [onCancel]);

  return (
    <div ref={overlayRef} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={onCancel} onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }}>
      <div className="bg-surface rounded-[var(--radius-lg)] border border-border w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 id="confirm-title" className="font-heading text-base font-semibold text-text">{title}</h2>
          <button type="button" className="bg-transparent border-none text-2xl text-text-muted cursor-pointer hover:text-text leading-none p-1" onClick={onCancel} aria-label="Close">&times;</button>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-text-secondary leading-relaxed">{message}</p>
        </div>
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-border">
          <button type="button" className="text-sm font-semibold py-2 px-4 rounded-[var(--radius-sm)] bg-transparent border border-border text-text-secondary cursor-pointer hover:bg-hover-bg transition-colors duration-150" onClick={onCancel}>{cancelLabel || 'Cancel'}</button>
          <button type="button" className={`text-sm font-semibold py-2 px-4 rounded-[var(--radius-sm)] text-white cursor-pointer border-none transition-colors duration-150 ${variant === 'danger' ? 'bg-danger hover:bg-danger-dark' : 'bg-primary hover:bg-primary-dark'}`} onClick={onConfirm}>
            {confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
