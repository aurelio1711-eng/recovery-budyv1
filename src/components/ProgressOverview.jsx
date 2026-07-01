import { motion } from 'motion/react';
import ProgressBar from './ProgressBar';
import { CATEGORIES } from '../data/categories';

export default function ProgressOverview({ groups }) {
  return (
    <motion.div
      className="progress-overview"
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
            <motion.div
              key={cat.id}
              className="progress-card counter-card"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
              }}
            >
              <div className="progress-card-header">
                <span className="progress-label">{cat.label}</span>
              </div>
              <motion.span
                className="counter-value"
                key={completed}
                initial={{ scale: 1.4 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              >
                {completed}
              </motion.span>
              <span className="counter-label">sessions attended</span>
            </motion.div>
          );
        }

        return (
          <motion.div
            key={cat.id}
            className="progress-card"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
            }}
          >
            <div className="progress-card-header">
              <span className="progress-label">{cat.label}</span>
              <motion.span
                className="progress-pct"
                key={pct}
                initial={{ scale: 1.4, color: 'var(--color-secondary)' }}
                animate={{ scale: 1, color: pct === 100 ? 'var(--color-primary)' : 'var(--color-secondary)' }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              >
                {pct}%
              </motion.span>
            </div>
            <ProgressBar value={pct} />
            <span className="progress-detail">{completed} / {required}</span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
