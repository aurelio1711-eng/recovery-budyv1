import { memo } from 'react';
import { motion } from 'motion/react';
import { RefreshIcon, CheckIcon } from './Icons';

// Staggered entrance animation variants for each card in the grid
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: i => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.04, type: 'spring', stiffness: 300, damping: 25 },
  }),
};

// A single group card showing progress, check-in/undo actions, and recurring badge
const GroupCard = memo(function GroupCard({ group, onCheckIn, onCheckOut, canCheckIn = true, index = 0 }) {
  const progress = group.required > 0 ? Math.min(100, Math.round((group.completed / group.required) * 100)) : 0;
  const isComplete = group.required > 0 && group.completed >= group.required;
  const isRecurring = group.recurring || group.required === 999;

  return (
    <motion.article
      className={`group-card ${isComplete ? 'complete' : ''} ${isRecurring ? 'recurring' : ''}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      layout
    >
      <div className="group-header">
        <h3 className="group-name">{group.name}</h3>
        {group.note && <span className="group-note">{group.note}</span>}
      </div>

        {!isRecurring && group.required > 0 && (
        <div className="group-progress">
          <div
            className="progress-bar-bg"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${group.name}: ${group.completed} of ${group.required} sessions (${progress}%)`}
          >
            <motion.div
              className="progress-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.05 }}
            />
          </div>
          <motion.span
            className="progress-text"
            key={group.completed}
            initial={{ scale: 1.3, color: 'var(--color-secondary)' }}
            animate={{ scale: 1, color: isComplete ? 'var(--color-success)' : 'var(--color-text-muted)' }}
            transition={{ duration: 0.3 }}
          >
            {group.completed} / {group.required} {isComplete && <CheckIcon />}
          </motion.span>
        </div>
      )}

      {isRecurring && (
        <div className="recurring-badge">
          <span><RefreshIcon /> Ongoing</span>
          <motion.span
            className="session-count"
            key={group.completed}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
          >
            {group.completed} sessions
          </motion.span>
        </div>
      )}

      <div className="group-actions">
        <button
          className="btn-checkin"
          onClick={onCheckIn}
          disabled={!canCheckIn && !isRecurring}
          aria-disabled={!canCheckIn && !isRecurring}
          title={!canCheckIn && !isRecurring ? `All ${group.required} required sessions completed` : undefined}
        >
          {isRecurring ? 'Attend Session' : isComplete ? 'Completed' : 'Check In'}
        </button>
        {(group.completed > 0 || isRecurring) && (
          <button className="btn-checkout" onClick={onCheckOut}>
            Undo
          </button>
        )}
      </div>
    </motion.article>
  );
});

export default GroupCard;