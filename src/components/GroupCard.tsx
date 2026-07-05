import { memo } from 'react';
import { m } from 'motion/react';
import { RefreshIcon, CheckIcon } from './Icons';
import type { Group } from '../types';

interface GroupCardProps {
  group: Group;
  onCheckIn: () => void;
  onCheckOut: () => void;
  canCheckIn?: boolean;
  index?: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.04, type: 'spring' as const, stiffness: 300, damping: 25 },
  }),
};

const GroupCard = memo(function GroupCard({ group, onCheckIn, onCheckOut, canCheckIn = true, index = 0 }: GroupCardProps) {
  const progress = group.required > 0 ? Math.min(100, Math.round((group.completed / group.required) * 100)) : 0;
  const isComplete = group.required > 0 && group.completed >= group.required;
  const isRecurring = group.recurring || group.required === 999;

  return (
    <m.article
      className={`bg-surface rounded-[var(--radius-md)] border ${isComplete ? 'border-success' : 'border-border'} p-4`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      layout
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-heading text-sm font-semibold text-text">{group.name}</h3>
      </div>

        {!isRecurring && group.required > 0 && (
        <div className="mb-3">
          <div
            className="h-2 bg-border rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${group.name}: ${group.completed} of ${group.required} sessions (${progress}%)`}
          >
            <m.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.05 }}
            />
          </div>
          <m.span
            className="text-xs mt-1.5 block tabular-nums"
            key={group.completed}
            initial={{ scale: 1.3, color: 'var(--color-secondary)' }}
            animate={{ scale: 1, color: isComplete ? 'var(--color-success-dark)' : 'var(--color-text-muted)' }}
            transition={{ duration: 0.3 }}
          >
            {group.completed} / {group.required} {isComplete && <CheckIcon />}
          </m.span>
        </div>
      )}

      {isRecurring && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-text-muted flex items-center gap-1"><RefreshIcon className="w-3.5 h-3.5" /> Ongoing</span>
          <m.span
            className="text-xs text-text font-semibold tabular-nums"
            key={group.completed}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
          >
            {group.completed} sessions
          </m.span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          className={`text-xs font-semibold py-1.5 px-3 rounded-[var(--radius-sm)] border-none cursor-pointer transition-colors duration-150 ${isComplete ? 'bg-success-light text-success-dark' : 'bg-primary text-white hover:bg-primary-dark'}`}
          onClick={onCheckIn}
          disabled={!canCheckIn && !isRecurring}
          aria-disabled={!canCheckIn && !isRecurring}
          title={!canCheckIn && !isRecurring ? `All ${group.required} required sessions completed` : undefined}
        >
          {isRecurring ? 'Attend Session' : isComplete ? 'Completed' : 'Check In'}
        </button>
        {(group.completed > 0 || isRecurring) && (
          <button className="text-xs font-semibold py-1.5 px-3 rounded-[var(--radius-sm)] bg-transparent border border-border text-text-secondary cursor-pointer hover:bg-hover-bg transition-colors duration-150" onClick={onCheckOut}>
            Undo
          </button>
        )}
      </div>
    </m.article>
  );
});

export default GroupCard;
