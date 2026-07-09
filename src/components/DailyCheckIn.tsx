import { useState, useRef, useEffect, useCallback } from 'react';
import { getToday } from '../services/nycTime';
import SignaturePad from './SignaturePad';
import type { Group } from '../types';

interface DailyCheckInProps {
  group: Group;
  onSubmit: (groupId: string, date: string, notes: string, signature: string | null) => void;
  onClose: () => void;
}

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function DailyCheckIn({ group, onSubmit, onClose }: DailyCheckInProps) {
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => getToday());
  const [signature, setSignature] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

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
      if (ke.key === 'Escape') { onClose(); return; }
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
  }, [onClose]);

  if (showSignaturePad) {
    return (
      <SignaturePad
        onSave={(dataUrl) => {
          setSignature(dataUrl);
          setShowSignaturePad(false);
        }}
        onClose={() => setShowSignaturePad(false)}
      />
    );
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 safe-area-inset-bottom"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkin-title"
      onClick={handleOverlayClick}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      onTouchStart={handleTouchStart}
    >
      <div
        ref={contentRef}
        className="bg-surface rounded-[var(--radius-lg)] border border-border w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 id="checkin-title" className="font-heading text-base font-semibold text-text">Check In: {group.name}</h2>
          <button type="button" className="bg-transparent border-none text-2xl text-text-muted cursor-pointer hover:text-text leading-none p-1" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="checkin-date" className="text-sm font-medium text-text">Date</label>
            <input
              id="checkin-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm px-3 py-2 rounded-[var(--radius-sm)] border border-border-input bg-background text-text font-body focus-visible:outline-2 focus-visible:outline-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="checkin-notes" className="text-sm font-medium text-text">Notes (optional)</label>
            <textarea
              id="checkin-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How was your session? Notes..."
              rows={4}
              className="text-sm px-3 py-2 rounded-[var(--radius-sm)] border border-border-input bg-background text-text font-body resize-vertical focus-visible:outline-2 focus-visible:outline-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text">Signature</span>
            {signature ? (
              <div className="flex items-center gap-3">
                <img src={signature} alt="Signed" className="h-10 border border-border rounded-[var(--radius-sm)]" />
                <button type="button" className="text-xs font-semibold py-1.5 px-3 rounded-[var(--radius-sm)] bg-transparent border border-border text-text-secondary cursor-pointer hover:bg-hover-bg transition-colors duration-150" onClick={() => setSignature(null)}>Remove</button>
              </div>
            ) : (
              <button type="button"
                className="w-full py-2.5 px-5 border-2 border-dashed border-border rounded-[var(--radius-sm)] bg-transparent cursor-pointer text-text-secondary font-semibold text-sm font-body transition-all duration-200 hover:border-primary"
                onClick={() => setShowSignaturePad(true)}
              >
                + Get Signature
              </button>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-border">
          <button type="button" className="text-sm font-semibold py-2 px-4 rounded-[var(--radius-sm)] bg-transparent border border-border text-text-secondary cursor-pointer hover:bg-hover-bg transition-colors duration-150" onClick={onClose}>Cancel</button>
          <button type="button"
            className="text-sm font-semibold py-2 px-4 rounded-[var(--radius-sm)] bg-primary text-white cursor-pointer border-none hover:bg-primary-dark transition-colors duration-150"
            onClick={() => onSubmit(group.id, selectedDate, notes, signature)}
          >
            Complete Check In
          </button>
        </div>
      </div>
    </div>
  );
}
