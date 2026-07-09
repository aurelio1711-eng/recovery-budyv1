import { useState, useRef, useEffect, useCallback } from 'react';
import { getToday } from '../services/nycTime';
import type { Group } from '../types';

interface BulkCheckInProps {
  groups: Group[];
  onSubmit: (selections: { groupId: string; date: string; notes: string }[]) => void;
  onClose: () => void;
}

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const CATEGORY_LABELS: Record<string, string> = {
  orientation: 'Orientation',
  clinical: 'Clinical',
  mandatory: 'Mandatory',
  after30: 'After 30 Days',
  support: 'Support',
  other: 'Other',
};

export default function BulkCheckIn({ groups, onSubmit, onClose }: BulkCheckInProps) {
  const [selectedDate, setSelectedDate] = useState(() => getToday());
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  const eligibleGroups = groups.filter(g => g.recurring || g.completed < g.required);

  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
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

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedGroups.size === eligibleGroups.length) {
      setSelectedGroups(new Set());
    } else {
      setSelectedGroups(new Set(eligibleGroups.map(g => g.id)));
    }
  };

  const groupedByCategory = eligibleGroups.reduce<Record<string, Group[]>>((acc, g) => {
    if (!acc[g.category]) acc[g.category] = [];
    acc[g.category].push(g);
    return acc;
  }, {});

  const handleSubmit = () => {
    if (selectedGroups.size === 0) return;
    const selections = Array.from(selectedGroups).map(groupId => ({
      groupId,
      date: selectedDate,
      notes,
    }));
    onSubmit(selections);
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 safe-area-inset-bottom"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-checkin-title"
      onClick={handleOverlayClick}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      onTouchStart={handleTouchStart}
    >
      <div
        ref={contentRef}
        className="bg-surface rounded-[var(--radius-lg)] border border-border w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 id="bulk-checkin-title" className="font-heading text-base font-semibold text-text">Bulk Check-In</h2>
          <button type="button" className="bg-transparent border-none text-2xl text-text-muted cursor-pointer hover:text-text leading-none p-1" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bulk-date" className="text-sm font-medium text-text">Date</label>
            <input
              id="bulk-date"
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="text-sm px-3 py-2 rounded-[var(--radius-sm)] border border-border-input bg-background text-text font-body focus-visible:outline-2 focus-visible:outline-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text">Groups ({selectedGroups.size} selected)</label>
              <button type="button"
                className="text-xs font-semibold text-primary bg-transparent border-none cursor-pointer hover:text-primary-dark"
                onClick={toggleAll}
              >
                {selectedGroups.size === eligibleGroups.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-[40vh] overflow-y-auto border border-border rounded-[var(--radius-sm)]">
              {Object.entries(groupedByCategory).map(([cat, catGroups]) => (
                <div key={cat}>
                  <div className="px-3 py-1.5 bg-hover-bg text-xs font-semibold text-text-secondary border-b border-border">
                    {CATEGORY_LABELS[cat] || cat}
                  </div>
                  {catGroups.map(g => (
                    <button type="button"
                      key={g.id}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left bg-transparent border-none border-b border-border cursor-pointer transition-colors duration-100 hover:bg-hover-bg ${selectedGroups.has(g.id) ? 'bg-primary/5' : ''}`}
                      onClick={() => toggleGroup(g.id)}
                    >
                      <span className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-150 ${selectedGroups.has(g.id) ? 'bg-primary border-primary' : 'border-border-input'}`}>
                        {selectedGroups.has(g.id) && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-text">{g.name}</span>
                        <span className="text-xs text-text-muted ml-2">
                          {g.recurring ? `${g.completed} sessions` : `${g.completed}/${g.required}`}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="bulk-notes" className="text-sm font-medium text-text">Shared Notes (optional)</label>
            <textarea
              id="bulk-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notes for all selected groups..."
              rows={3}
              className="text-sm px-3 py-2 rounded-[var(--radius-sm)] border border-border-input bg-background text-text font-body resize-vertical focus-visible:outline-2 focus-visible:outline-primary"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-border">
          <button type="button" className="text-sm font-semibold py-2 px-4 rounded-[var(--radius-sm)] bg-transparent border border-border text-text-secondary cursor-pointer hover:bg-hover-bg transition-colors duration-150" onClick={onClose}>Cancel</button>
          <button type="button"
            className="text-sm font-semibold py-2 px-4 rounded-[var(--radius-sm)] bg-primary text-white cursor-pointer border-none hover:bg-primary-dark transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={selectedGroups.size === 0}
          >
            Check In {selectedGroups.size > 0 ? `(${selectedGroups.size})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
