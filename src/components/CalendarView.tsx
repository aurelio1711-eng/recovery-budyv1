import { useState, useMemo } from 'react';
import { m } from 'motion/react';
import { parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { loadCheckIns } from '../services/storage';
import { getToday } from '../services/nycTime';
import type { CheckIn } from '../types';

const SPRING = { type: 'spring' as const, stiffness: 150, damping: 18, mass: 0.8 };
const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getIntensity(count: number): string {
  if (count === 0) return 'bg-border/50';
  if (count <= 2) return 'bg-primary/20';
  if (count <= 4) return 'bg-primary/40';
  if (count <= 6) return 'bg-primary/60';
  return 'bg-primary/80';
}

interface CalendarViewProps {
  refreshKey?: number;
}

export default function CalendarView({ refreshKey = 0 }: CalendarViewProps) {
  const today = parseISO(getToday());
  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const allCheckIns = useMemo(() => {
    const data = loadCheckIns();
    return Object.values(data);
  }, []);

  const checkInsByDate = useMemo(() => {
    const map: Record<string, CheckIn[]> = {};
    allCheckIns.forEach(ci => {
      if (!map[ci.date]) map[ci.date] = [];
      map[ci.date].push(ci);
    });
    return map;
  }, [allCheckIns]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const selectedCheckIns = selectedDay ? checkInsByDate[format(selectedDay, 'yyyy-MM-dd')] || [] : [];

  return (
    <m.div
      className="max-w-[720px]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <h1 className="font-heading text-2xl font-bold text-text">Calendar</h1>
        </div>
      </div>

      <div className="bg-surface rounded-[var(--radius-lg)] border border-border p-5">
        <div className="flex items-center justify-between mb-5">
          <button type="button"
            className="text-sm font-semibold py-1.5 px-3 rounded-[var(--radius-sm)] bg-transparent border border-border text-text-secondary cursor-pointer hover:bg-hover-bg transition-colors duration-150"
            onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
          >
            &larr; Prev
          </button>
          <h2 className="font-heading text-base font-semibold text-text">{format(currentMonth, 'MMMM yyyy')}</h2>
          <button type="button"
            className="text-sm font-semibold py-1.5 px-3 rounded-[var(--radius-sm)] bg-transparent border border-border text-text-secondary cursor-pointer hover:bg-hover-bg transition-colors duration-150"
            onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
          >
            Next &rarr;
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEK_DAYS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-text-muted py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const dateStr = format(d, 'yyyy-MM-dd');
            const dayCheckIns = checkInsByDate[dateStr] || [];
            const count = dayCheckIns.length;
            const inMonth = isSameMonth(d, currentMonth);
            const isToday = isSameDay(d, today);
            const isSelected = selectedDay && isSameDay(d, selectedDay);

            return (
              <button
                type="button"
                key={dateStr}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-[var(--radius-sm)] text-sm transition-all duration-150 cursor-pointer border-none
                  ${inMonth ? 'text-text' : 'text-text-lighter'}
                  ${isToday ? 'ring-2 ring-primary' : ''}
                  ${isSelected ? 'bg-primary text-white' : getIntensity(count)}
                  hover:ring-1 hover:ring-primary/50`}
                onClick={() => setSelectedDay(d)}
              >
                <span className={`text-xs font-medium ${isSelected ? 'text-white' : ''}`}>{format(d, 'd')}</span>
                {count > 0 && inMonth && (
                  <span className={`absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] flex items-center justify-center text-[0.55rem] font-bold rounded-full ${isSelected ? 'bg-white text-primary' : 'bg-primary text-white'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
          <span className="text-xs text-text-muted">Intensity:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-sm bg-border/50" />
            <span className="text-xs text-text-muted">0</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-sm bg-primary/20" />
            <span className="text-xs text-text-muted">1-2</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-sm bg-primary/40" />
            <span className="text-xs text-text-muted">3-4</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-sm bg-primary/60" />
            <span className="text-xs text-text-muted">5-6</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-sm bg-primary/80" />
            <span className="text-xs text-text-muted">7+</span>
          </div>
        </div>
      </div>

      {selectedDay && (
        <m.div
          className="mt-4 bg-surface rounded-[var(--radius-lg)] border border-border p-5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
        >
          <h3 className="font-heading text-sm font-semibold text-text mb-3">
            {format(selectedDay, 'EEEE, MMMM d, yyyy')}
          </h3>
          {selectedCheckIns.length === 0 ? (
            <p className="text-sm text-text-muted">No check-ins on this day</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {selectedCheckIns.map((ci, i) => (
                <m.li
                  key={`${ci.groupId}-${i}`}
                  className="flex items-center gap-3 bg-background rounded-[var(--radius-sm)] border border-border p-3"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 * i, ...SPRING }}
                >
                  <span className="flex-1 font-medium text-sm text-text capitalize">{ci.groupId.replace(/-/g, ' ')}</span>
                  <span className="text-xs tabular-nums text-text-muted">{new Date(ci.timestamp).toLocaleTimeString()}</span>
                  {ci.notes && <span className="text-xs text-text-muted truncate max-w-[200px]">— {ci.notes}</span>}
                  {ci.signature && (
                    <img src={ci.signature} alt="Signature" className="h-5 border border-border rounded" />
                  )}
                </m.li>
              ))}
            </ul>
          )}
        </m.div>
      )}
    </m.div>
  );
}
