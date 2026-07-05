import { useState, useMemo } from 'react';
import { m } from 'motion/react';
import { parseISO, addDays, startOfWeek, endOfWeek, format } from 'date-fns';
import { loadCheckIns, loadSettings, getDaysSinceProgramStart, isEligibleForPass, getDaysUntilNextPass } from '../services/storage';
import { CATEGORIES } from '../data/categories';
import { getToday } from '../services/nycTime';
import type { Group, CheckIn, CategoryAnalytics, Settings } from '../types';

function ReviewIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

interface PerformanceReviewProps {
  groups: Group[];
  refreshKey?: number;
}

export default function PerformanceReview({ groups, refreshKey = 0 }: PerformanceReviewProps) {
  const spring = { type: 'spring' as const, stiffness: 150, damping: 18, mass: 0.8 };

  const groupMap: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    groups.forEach(g => { map[g.id] = g.name; });
    return map;
  }, [groups]);

  const [weekOffset, setWeekOffset] = useState<number>(0);

  const weekStart: Date = useMemo(() => {
    const today = parseISO(getToday());
    const weekDate = addDays(today, weekOffset * 7);
    return startOfWeek(weekDate, { weekStartsOn: 1 });
  }, [weekOffset]);

  const weekEnd: Date = useMemo(() => {
    return endOfWeek(weekStart, { weekStartsOn: 1 });
  }, [weekStart]);

  const weekLabel: string = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;

  const checkIns: CheckIn[] = useMemo(() => {
    const data = loadCheckIns();
    return Object.values(data).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [groups, refreshKey]);

  const weekCheckIns: CheckIn[] = useMemo(() => {
    const start = format(weekStart, 'yyyy-MM-dd');
    const end = format(weekEnd, 'yyyy-MM-dd');
    return checkIns
      .filter(c => c.date >= start && c.date <= end)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.timestamp || 0) - (b.timestamp || 0));
  }, [checkIns, weekStart, weekEnd]);

  const settings: Settings = useMemo(() => loadSettings(), [groups, refreshKey]);

  const daysSinceStart: number = useMemo(() => getDaysSinceProgramStart(), [groups, refreshKey]);

  const eligibleForPass: boolean = useMemo(() => isEligibleForPass(), [groups, refreshKey]);

  const daysUntilPass: number = useMemo(() => getDaysUntilNextPass(), [groups, refreshKey]);

  const totalCheckIns: number = checkIns.length;
  const earliestDate: string | null = checkIns.length > 0 ? checkIns[checkIns.length - 1].date : null;
  const activeDays: number = new Set(checkIns.map(c => c.date)).size;

  const categoryAnalytics: CategoryAnalytics[] = useMemo(() => {
    return CATEGORIES.map(cat => {
      const catGroups: Group[] = groups.filter(g => g.category === cat.id);
      const required: number = catGroups.reduce((sum, g) => sum + (g.required || 0), 0);
      const completed: number = catGroups.reduce((sum, g) => sum + (g.completed || 0), 0);
      const isRecurring: boolean = catGroups.every(g => g.recurring || g.required === 999);
      const pct: number = required > 0 ? Math.round((completed / required) * 100) : 0;
      return { ...cat, required, completed, pct, isRecurring, groups: catGroups };
    });
  }, [groups]);

  const completedGroups: Group[] = useMemo(() => {
    return groups.filter(g => !g.recurring && g.required !== 999 && g.completed >= g.required);
  }, [groups]);

  const nearCompletionGroups: Group[] = useMemo(() => {
    return groups.filter(g => !g.recurring && g.required !== 999 && g.completed > 0 && g.completed < g.required && (g.completed / g.required) >= 0.75);
  }, [groups]);

  const notStartedGroups: Group[] = useMemo(() => {
    return groups.filter(g => !g.recurring && g.required !== 999 && g.completed === 0);
  }, [groups]);

  const recentCheckIns: CheckIn[] = checkIns.slice(0, 10);

  return (
    <m.div
      className="max-w-[960px]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-primary"><ReviewIcon /></span>
          <h1 className="font-heading text-2xl font-bold text-text">Performance Review</h1>
        </div>
        <span className="text-xs font-semibold text-text-muted bg-hover-bg px-3 py-1.5 rounded-full">{daysSinceStart} days in program</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { value: totalCheckIns, label: 'Total Check-Ins' },
          { value: activeDays, label: 'Active Days' },
          { value: completedGroups.length, label: 'Groups Completed' },
          {
            value: eligibleForPass ? (daysUntilPass === 0 ? 'Eligible' : `${daysUntilPass}d`) : `${30 - daysSinceStart}d`,
            label: eligibleForPass ? 'Weekend Pass' : 'Until Pass Eligible',
            color: eligibleForPass ? 'var(--color-success)' : 'var(--color-text-muted)'
          }
        ].map((item, i) => (
          <m.div
            key={item.label}
            className="bg-surface rounded-[var(--radius-md)] border border-border p-4 flex flex-col"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, ...spring }}
          >
            <span className="text-2xl font-bold tabular-nums mb-1" style={{ color: 'color' in item ? item.color : undefined }}>
              {item.value}
            </span>
            <span className="text-xs text-text-muted">{item.label}</span>
          </m.div>
        ))}
      </div>

      <section className="mb-6">
        <h2 className="font-heading text-base font-semibold text-text mb-3">Category Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categoryAnalytics.map((cat, i) => (
            <m.div
              key={cat.id}
              className="bg-surface rounded-[var(--radius-md)] border border-border p-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, ...spring }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text">{cat.label}</span>
                {cat.isRecurring ? (
                  <span className="text-xs font-semibold text-text-secondary">{cat.completed} sessions</span>
                ) : (
                  <span className={`text-xs font-bold ${cat.pct === 100 ? 'text-success' : 'text-secondary'}`}>{cat.pct}%</span>
                )}
              </div>
              {!cat.isRecurring && (
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <m.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.pct}%` }}
                    transition={{ delay: 0.2 + 0.05 * i, duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              )}
              <span className="block text-xs text-text-muted mt-1.5 tabular-nums">{cat.completed} / {cat.isRecurring ? '∞' : cat.required}</span>
            </m.div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <section className="bg-surface rounded-[var(--radius-md)] border border-border p-4">
          <h2 className="font-heading text-sm font-semibold text-text mb-3">Groups Completed</h2>
          {completedGroups.length === 0 ? (
            <p className="text-sm text-text-muted">No groups completed yet</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {completedGroups.map(g => (
                <li key={g.id} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="text-text">{g.name}</span>
                  <span className="text-success font-bold">&#10003;</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-surface rounded-[var(--radius-md)] border border-border p-4">
          <h2 className="font-heading text-sm font-semibold text-text mb-3">Near Completion ({nearCompletionGroups.length})</h2>
          {nearCompletionGroups.length === 0 ? (
            <p className="text-sm text-text-muted">No groups near completion</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {nearCompletionGroups.map(g => (
                <li key={g.id} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="text-text">{g.name}</span>
                  <span className="text-text-muted tabular-nums text-xs">{g.completed}/{g.required}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <section className="bg-surface rounded-[var(--radius-md)] border border-border p-4">
          <h2 className="font-heading text-sm font-semibold text-text mb-3">Not Yet Started</h2>
          {notStartedGroups.length === 0 ? (
            <p className="text-sm text-text-muted">All groups have been started</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {notStartedGroups.map(g => (
                <li key={g.id} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="text-text">{g.name}</span>
                  <span className="text-text-lighter text-xs">Need {g.required}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-surface rounded-[var(--radius-md)] border border-border p-4">
          <h2 className="font-heading text-sm font-semibold text-text mb-3">Pass History</h2>
          {(!settings.passHistory || settings.passHistory.length === 0) ? (
            <p className="text-sm text-text-muted">No weekend passes claimed yet</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {settings.passHistory.slice().reverse().map((date, i) => (
                <li key={i} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="text-text">Weekend Pass</span>
                  <span className="text-text-muted text-xs">{date}</span>
                </li>
              ))}
            </ul>
          )}
          {settings.lastPassDate && (
            <p className="text-xs text-text-muted mt-2 pt-2 border-t border-border">Last pass: {settings.lastPassDate}</p>
          )}
        </section>
      </div>

      <section className="bg-surface rounded-[var(--radius-md)] border border-border p-4 mb-4">
        <h2 className="font-heading text-sm font-semibold text-text mb-3">Weekly Attendance</h2>
        <div className="flex items-center justify-center gap-3 mb-3">
          <button className="text-xs font-semibold py-1.5 px-3 rounded-[var(--radius-sm)] bg-transparent border border-border text-text-secondary cursor-pointer hover:bg-hover-bg transition-colors duration-150" onClick={() => setWeekOffset(o => o - 1)} aria-label="Previous week">&larr; Prev</button>
          <span className="text-xs font-medium text-text">{weekLabel}</span>
          <button className="text-xs font-semibold py-1.5 px-3 rounded-[var(--radius-sm)] bg-transparent border border-border text-text-secondary cursor-pointer hover:bg-hover-bg transition-colors duration-150" onClick={() => setWeekOffset(o => o + 1)} aria-label="Next week">Next &rarr;</button>
        </div>
        {weekCheckIns.length === 0 ? (
          <p className="text-sm text-text-muted">No check-ins this week</p>
        ) : (
          <div className="border border-border rounded-[var(--radius-sm)] overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_80px] bg-hover-bg text-xs font-semibold text-text-secondary py-2 px-3">
              <span>Date</span>
              <span>Group</span>
              <span className="text-center">Signature</span>
            </div>
            {weekCheckIns.map((ci, i) => (
              <m.div
                key={`${ci.groupId}-${ci.date}`}
                className="grid grid-cols-[1fr_1fr_80px] py-2 px-3 text-sm border-t border-border items-center"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.02 * i, ...spring }}
              >
                <span className="text-text-muted text-xs">{ci.date}</span>
                <span className="text-text">{groupMap[ci.groupId] || ci.groupId.replace(/-/g, ' ')}</span>
                <span className="text-center">
                  {ci.signature ? (
                    <img src={ci.signature} alt="Signature" className="h-6 inline-block border border-border rounded" />
                  ) : (
                    <span className="text-text-lighter text-xs">--</span>
                  )}
                </span>
              </m.div>
            ))}
          </div>
        )}
      </section>

      {recentCheckIns.length > 0 && (
        <section className="bg-surface rounded-[var(--radius-md)] border border-border p-4">
          <h2 className="font-heading text-sm font-semibold text-text mb-3">Recent Check-Ins</h2>
          <div className="border border-border rounded-[var(--radius-sm)] overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_1fr] bg-hover-bg text-xs font-semibold text-text-secondary py-2 px-3">
              <span>Group</span>
              <span>Date</span>
              <span>Time</span>
            </div>
            {recentCheckIns.map((ci, i) => (
              <m.div
                key={`${ci.groupId}-${ci.date}-${i}`}
                className="grid grid-cols-[1fr_1fr_1fr] py-2 px-3 text-sm border-t border-border"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.02 * i, ...spring }}
              >
                <span className="text-text">{ci.groupId.replace(/-/g, ' ')}</span>
                <span className="text-text-muted text-xs">{ci.date}</span>
                <span className="text-text-muted text-xs">{ci.timestamp ? new Date(ci.timestamp).toLocaleTimeString() : '-'}</span>
              </m.div>
            ))}
          </div>
        </section>
      )}
    </m.div>
  );
}
