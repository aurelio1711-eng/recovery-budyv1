import { useState, useEffect, useRef } from 'react';
import { m } from 'motion/react';
import { loadSettings, getDaysSinceProgramStart, getDaysUntilNextPass, getNextPassDate, isEligibleForPass, updatePassStatus } from '../services/storage';
import { getToday } from '../services/nycTime';
import type { Settings } from '../types';

interface Props {
  refreshKey?: number;
}

function computePassState() {
  return {
    daysSinceStart: getDaysSinceProgramStart(),
    daysUntilNextPass: getDaysUntilNextPass(),
    nextPassDate: getNextPassDate(),
    eligible: isEligibleForPass(),
    settings: loadSettings(),
  };
}

export default function PassCountdown({ refreshKey = 0 }: Props) {
  const [passState, setPassState] = useState(computePassState);
  const [justClaimed, setJustClaimed] = useState<boolean>(false);

  useEffect(() => {
    setPassState(computePassState());
  }, [refreshKey]);

  const { daysSinceStart, daysUntilNextPass, nextPassDate, eligible, settings } = passState;

  useEffect(() => {
    const interval = setInterval(() => setPassState(computePassState()), 86400000);
    return () => clearInterval(interval);
  }, []);

  const handleClaimPass = () => {
    updatePassStatus(getToday());
    setJustClaimed(true);
    setPassState(computePassState());
  };

  const getStatusColor = (): string => {
    if (eligible && daysUntilNextPass === 0) return 'var(--color-primary)';
    if (eligible) return 'var(--color-warning)';
    return 'var(--color-text-muted)';
  };

  const getProgressValue = (): number => {
    if (!eligible) return (daysSinceStart / 30) * 100;
    if (daysUntilNextPass === 0) return 100;
    const daysSinceLastPass = 30 - daysUntilNextPass;
    return (daysSinceLastPass / 30) * 100;
  };

  const getProgressLabel = (): string => {
    if (!eligible) return `${daysSinceStart}/30 days - ${30 - daysSinceStart} day${30 - daysSinceStart !== 1 ? 's' : ''} remaining`;
    if (daysUntilNextPass === 0) return 'Ready for pass!';
    const daysSinceLastPass = 30 - daysUntilNextPass;
    return `${daysSinceLastPass}/30 days since last pass`;
  };

  const getStatusMessage = (): string => {
    if (!eligible) {
      const remaining = 30 - daysSinceStart;
      return `Program Start: ${daysSinceStart} day${daysSinceStart !== 1 ? 's' : ''} complete. ${remaining} day${remaining !== 1 ? 's' : ''} until eligible for weekend pass.`;
    }
    if (daysUntilNextPass === 0) {
      return 'Eligible for weekend pass today!';
    }
    return `Next weekend pass available in ${daysUntilNextPass} day${daysUntilNextPass !== 1 ? 's' : ''} (${nextPassDate}).`;
  };

  return (
    <div className="bg-surface rounded-[var(--radius-lg)] border border-border p-5 max-sm:p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-base font-semibold text-text">Weekend Pass Eligibility</h2>
        <div
          className="text-xs font-bold text-white px-3 py-1 rounded-full"
          style={{ backgroundColor: getStatusColor() }}
        >
          {eligible ? 'Eligible' : 'In Progress'}
        </div>
      </div>

      <div className="flex items-center gap-6 max-sm:flex-col max-sm:gap-4">
        <div className="flex flex-col items-center shrink-0">
          <m.span
            className="text-4xl font-bold font-mono tabular-nums"
            key={daysSinceStart}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            style={{ color: getStatusColor() }}
          >
            {daysSinceStart}
          </m.span>
          <span className="text-xs text-text-muted mt-0.5">Days in Program</span>
        </div>

        <div className="flex-1 w-full">
          <progress
            className="h-2.5 bg-border rounded-full overflow-hidden appearance-none [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-border [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary"
            value={Math.round(getProgressValue())}
            max={100}
            aria-label={getProgressLabel()}
          />
          <span className="block text-xs text-text-muted mt-1.5">
            {getProgressLabel()}
          </span>
        </div>

        {eligible && nextPassDate && (
          <div className="flex flex-col gap-1 text-xs shrink-0 max-sm:w-full">
            <div className="flex gap-2">
              <span className="text-text-muted">Next Pass Available:</span>
              <span className="text-text font-semibold">{nextPassDate}</span>
            </div>
            {settings?.lastPassDate && (
              <div className="flex gap-2">
                <span className="text-text-muted">Last Pass Date:</span>
                <span className="text-text font-semibold">{settings.lastPassDate}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 text-xs text-text-muted" role="status">
        {getStatusMessage()}
      </div>

      {eligible && daysUntilNextPass === 0 && !justClaimed && (
        <button type="button" className="mt-4 w-full font-heading text-sm font-semibold py-2.5 px-6 rounded-[var(--radius-md)] bg-primary text-white cursor-pointer border-none hover:bg-primary-dark transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2" onClick={handleClaimPass}>
          Claim Weekend Pass
        </button>
      )}
      {justClaimed && (
        <button type="button" className="mt-4 w-full font-heading text-sm font-semibold py-2.5 px-6 rounded-[var(--radius-md)] bg-primary-light text-text-muted border-none cursor-not-allowed opacity-60" disabled>
          Pass Claimed for Today
        </button>
      )}
    </div>
  );
}
