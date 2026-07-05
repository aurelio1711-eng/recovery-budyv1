import { m } from 'motion/react';
import ProgressBar from './ProgressBar';
import { CATEGORIES } from '../data/categories';
import type { Group } from '../types';

interface Props {
  groups: Group[];
}

export default function ProgressOverview({ groups }: Props) {
  return (
    <m.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
    >
      {CATEGORIES.map(cat => {
        const catGroups = groups.filter(g => g.category === cat.id);
        const required = catGroups.reduce((sum, g) => sum + (g.required || 0), 0);
        const completed = catGroups.reduce((sum, g) => sum + (g.completed || 0), 0);
        const isRecurring = catGroups.every(g => g.recurring || g.required === 999);
        const pct = required > 0 ? Math.round((completed / required) * 100) : 0;

        if (isRecurring) {
          return (
            <m.div
              key={cat.id}
              className="flex flex-col gap-1.5 bg-surface rounded-[var(--radius-md)] border border-border p-4"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-text-secondary">{cat.label}</span>
              </div>
              <m.span
                className="text-3xl font-bold text-primary tabular-nums"
                key={completed}
                initial={{ scale: 1.4 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              >
                {completed}
              </m.span>
              <span className="text-xs text-text-muted">sessions attended</span>
            </m.div>
          );
        }

        return (
          <m.div
            key={cat.id}
            className="flex flex-col gap-2 bg-surface rounded-[var(--radius-md)] border border-border p-4"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-text-secondary">{cat.label}</span>
              <m.span
                className="text-sm font-bold tabular-nums"
                key={pct}
                initial={{ scale: 1.4, color: 'var(--color-secondary)' }}
                animate={{ scale: 1, color: pct === 100 ? 'var(--color-primary)' : 'var(--color-secondary)' }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              >
                {pct}%
              </m.span>
            </div>
            <ProgressBar value={pct} />
            <span className="text-xs text-text-muted tabular-nums">{completed} / {required}</span>
          </m.div>
        );
      })}
    </m.div>
  );
}
