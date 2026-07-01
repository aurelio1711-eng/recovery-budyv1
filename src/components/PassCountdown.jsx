import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { loadSettings, getDaysSinceProgramStart, getDaysUntilNextPass, getNextPassDate, isEligibleForPass, updatePassStatus } from '../services/storage';
import { getToday } from '../services/nycTime';
import './PassCountdown.css';

// Weekend pass eligibility tracker — shows days in program, 30-day countdown,
// pass claim button, and history of claimed passes
export default function PassCountdown({ refreshKey = 0 }) {
  const [daysSinceStart, setDaysSinceStart] = useState(0);
  const [daysUntilNextPass, setDaysUntilNextPass] = useState(0);
  const [nextPassDate, setNextPassDate] = useState(null);
  const [eligible, setEligible] = useState(false);
  const [settings, setSettings] = useState(null);
  const [justClaimed, setJustClaimed] = useState(false);

  // Re-read all pass-related values from storage
  const refreshPassStatus = () => {
    const newDaysSinceStart = getDaysSinceProgramStart();
    const newDaysUntilPass = getDaysUntilNextPass();
    const newNextPassDate = getNextPassDate();
    const isEligible = isEligibleForPass();
    const storedSettings = loadSettings();

    setDaysSinceStart(newDaysSinceStart);
    setDaysUntilNextPass(newDaysUntilPass);
    setNextPassDate(newNextPassDate);
    setEligible(isEligible);
    setSettings(storedSettings);
  };

  // Refresh on mount and every 24 hours (or when refreshKey changes)
  useEffect(() => {
    refreshPassStatus();
    const interval = setInterval(refreshPassStatus, 86400000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  // Claim a weekend pass for today
  const handleClaimPass = () => {
    updatePassStatus(getToday());
    setJustClaimed(true);
    refreshPassStatus();
  };

  // Color coding: green = eligible today, yellow = eligible but waiting, muted = in progress
  const getStatusColor = () => {
    if (eligible && daysUntilNextPass === 0) return 'var(--color-primary)';
    if (eligible) return 'var(--color-warning)';
    return 'var(--color-text-muted)';
  };

  // Progress bar fill percentage toward next pass
  const getProgressValue = () => {
    if (!eligible) return (daysSinceStart / 30) * 100;
    if (daysUntilNextPass === 0) return 100;
    const daysSinceLastPass = 30 - daysUntilNextPass;
    return (daysSinceLastPass / 30) * 100;
  };

  // Human-readable progress label
  const getProgressLabel = () => {
    if (!eligible) return `${daysSinceStart}/30 days - ${30 - daysSinceStart} day${30 - daysSinceStart !== 1 ? 's' : ''} remaining`;
    if (daysUntilNextPass === 0) return 'Ready for pass!';
    const daysSinceLastPass = 30 - daysUntilNextPass;
    return `${daysSinceLastPass}/30 days since last pass`;
  };

  // Descriptive status message shown below the progress section
  const getStatusMessage = () => {
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
    <div className="pass-countdown">
      <div className="pass-countdown-header">
        <h2>Weekend Pass Eligibility</h2>
        <div 
          className="eligibility-badge"
          style={{ backgroundColor: getStatusColor() }}
        >
          {eligible ? 'Eligible' : 'In Progress'}
        </div>
      </div>

      <div className="pass-countdown-content">
        <div className="days-counter">
          <motion.span
            className="days-number"
            key={daysSinceStart}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            style={{ color: getStatusColor() }}
          >
            {daysSinceStart}
          </motion.span>
          <span className="days-label">Days in Program</span>
        </div>

          <div className="pass-progress">
          <div
            className="pc-progress-bar-bg"
            role="progressbar"
            aria-valuenow={Math.round(getProgressValue())}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={getProgressLabel()}
          >
            <div 
              className="pc-progress-bar-fill"
              style={{ 
                width: `${Math.min(100, getProgressValue())}%`,
                backgroundColor: getStatusColor()
              }}
            ></div>
          </div>
          <span className="pc-progress-text">
            {getProgressLabel()}
          </span>
        </div>

        {eligible && nextPassDate && (
          <div className="next-pass-info">
            <div className="next-pass-date">
              <span className="label">Next Pass Available:</span>
              <span className="date">{nextPassDate}</span>
            </div>
            {settings?.lastPassDate && (
              <div className="last-pass-info">
                <span className="label">Last Pass Date:</span>
                <span className="date">{settings.lastPassDate}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="status-message" role="status">
        {getStatusMessage()}
      </div>

      {eligible && daysUntilNextPass === 0 && !justClaimed && (
        <button className="btn-claim-pass" onClick={handleClaimPass}>
          Claim Weekend Pass
        </button>
      )}
      {justClaimed && (
        <button className="btn-claim-pass claimed" disabled>
          Pass Claimed for Today
        </button>
      )}
    </div>
  );
}