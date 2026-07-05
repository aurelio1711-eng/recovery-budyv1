import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { loadCheckIns } from '../services/storage';
import type { Group, CheckIn } from '../types';

interface SearchResult {
  type: 'group' | 'check-in';
  id: string;
  title: string;
  subtitle: string;
  date?: string;
  groupId?: string;
}

interface SearchModalProps {
  groups: Group[];
  onClose: () => void;
  onGroupSelect?: (group: Group) => void;
  onDateSelect?: (date: string) => void;
}

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function SearchModal({ groups, onClose, onGroupSelect, onDateSelect }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  const allCheckIns = useMemo(() => {
    const data = loadCheckIns();
    return Object.values(data).sort((a, b) => b.timestamp - a.timestamp);
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const groupResults: SearchResult[] = groups
      .filter(g => g.name.toLowerCase().includes(q) || g.id.toLowerCase().includes(q) || (g.note && g.note.toLowerCase().includes(q)))
      .map(g => ({
        type: 'group' as const,
        id: g.id,
        title: g.name,
        subtitle: `${g.completed}/${g.required === 999 ? '∞' : g.required} sessions • ${g.category}`,
      }));

    const checkInResults: SearchResult[] = allCheckIns
      .filter(ci => {
        const groupName = groups.find(g => g.id === ci.groupId)?.name || ci.groupId;
        return (
          groupName.toLowerCase().includes(q) ||
          ci.groupId.toLowerCase().includes(q) ||
          ci.date.includes(q) ||
          (ci.notes && ci.notes.toLowerCase().includes(q))
        );
      })
      .slice(0, 20)
      .map(ci => ({
        type: 'check-in' as const,
        id: `${ci.groupId}-${ci.date}`,
        title: groups.find(g => g.id === ci.groupId)?.name || ci.groupId.replace(/-/g, ' '),
        subtitle: ci.notes || 'No notes',
        date: ci.date,
        groupId: ci.groupId,
      }));

    return [...groupResults, ...checkInResults].slice(0, 30);
  }, [query, groups, allCheckIns]);

  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    lastFocused.current = document.activeElement as HTMLElement;
    inputRef.current?.focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
    };
    overlay.addEventListener('keydown', trap);
    return () => {
      overlay.removeEventListener('keydown', trap);
      lastFocused.current?.focus();
    };
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-[10vh] p-4 safe-area-inset-bottom"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      onClick={handleOverlayClick}
    >
      <m.div
        className="bg-surface rounded-[var(--radius-lg)] border border-border w-full max-w-lg shadow-xl"
        initial={{ opacity: 0, y: -20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted shrink-0"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search groups, notes, dates..."
            className="flex-1 bg-transparent border-none text-sm text-text font-body outline-none placeholder:text-text-muted"
          />
          <button
            className="text-xs font-semibold py-1 px-2 rounded bg-transparent border border-border text-text-secondary cursor-pointer hover:bg-hover-bg transition-colors duration-150"
            onClick={onClose}
          >
            ESC
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {query.trim() === '' ? (
            <div className="px-5 py-8 text-center text-sm text-text-muted">
              Type to search across groups, check-in notes, and dates
            </div>
          ) : results.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-text-muted">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <ul className="py-2">
              {results.map((r, i) => (
                <m.li
                  key={r.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.02 * i }}
                >
                  <button
                    className="w-full flex items-center gap-3 px-5 py-3 text-left bg-transparent border-none cursor-pointer hover:bg-hover-bg transition-colors duration-150"
                    onClick={() => {
                      if (r.type === 'group' && onGroupSelect) {
                        const group = groups.find(g => g.id === r.id);
                        if (group) onGroupSelect(group);
                      }
                      if (r.type === 'check-in' && onDateSelect && r.date) {
                        onDateSelect(r.date);
                      }
                      onClose();
                    }}
                  >
                    <span className={`shrink-0 w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center text-xs font-bold ${r.type === 'group' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'}`}>
                      {r.type === 'group' ? '⊞' : '✓'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-text truncate">{r.title}</div>
                      <div className="text-xs text-text-muted truncate">{r.subtitle}</div>
                    </div>
                    {r.date && (
                      <span className="shrink-0 text-xs text-text-muted tabular-nums">{r.date}</span>
                    )}
                  </button>
                </m.li>
              ))}
            </ul>
          )}
        </div>
      </m.div>
    </div>
  );
}
