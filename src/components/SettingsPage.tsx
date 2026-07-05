import { useState, useEffect } from 'react';
import { m } from 'motion/react';
import StartDateButton from './StartDateButton';
import { loadSettings, saveSettings } from '../services/storage';
import { requestNotificationPermission, getNotificationPermission, toggleNotifications, updateReminderSettings } from '../services/notifications';
import type { Settings } from '../types';

interface SettingsPageProps {
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
  onSettingsChange: () => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function SettingsPage({ onExport, onImport, onReset, onSettingsChange }: SettingsPageProps) {
  const spring = { type: 'spring' as const, stiffness: 150, damping: 18, mass: 0.8 };
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [permissionState, setPermissionState] = useState(() => getNotificationPermission());

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const handleToggleNotifications = async () => {
    if (!settings.notifications) {
      const perm = await requestNotificationPermission();
      setPermissionState(perm);
      if (perm !== 'granted') return;
    }
    const newEnabled = !settings.notifications;
    toggleNotifications(newEnabled);
    setSettings(prev => ({ ...prev, notifications: newEnabled }));
    onSettingsChange();
  };

  const handleTimeChange = (time: string) => {
    updateReminderSettings(time, settings.reminderDays);
    setSettings(prev => ({ ...prev, reminderTime: time }));
    onSettingsChange();
  };

  const handleDayToggle = (dayIndex: number) => {
    const current = settings.reminderDays || [];
    const next = current.includes(dayIndex)
      ? current.filter(d => d !== dayIndex)
      : [...current, dayIndex].sort();
    updateReminderSettings(settings.reminderTime, next);
    setSettings(prev => ({ ...prev, reminderDays: next }));
    onSettingsChange();
  };

  const notificationsBlocked = permissionState === 'denied';

  return (
    <m.div
      className="max-w-[640px]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
    >
      <h1 className="font-heading text-2xl font-bold text-text mb-6">Settings</h1>

      <section className="bg-surface rounded-[var(--radius-md)] border border-border p-5 mb-4">
        <h2 className="font-heading text-sm font-semibold text-text mb-1">Program Dates</h2>
        <p className="text-sm text-text-muted mb-3">Set your start date and reset all progress.</p>
        <StartDateButton onReset={onReset} onSettingsChange={onSettingsChange} />
      </section>

      <section className="bg-surface rounded-[var(--radius-md)] border border-border p-5 mb-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-heading text-sm font-semibold text-text">Notifications & Reminders</h2>
          <button
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer border-none ${settings.notifications ? 'bg-primary' : 'bg-border'}`}
            onClick={handleToggleNotifications}
            aria-label={settings.notifications ? 'Disable notifications' : 'Enable notifications'}
            disabled={notificationsBlocked}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${settings.notifications ? 'translate-x-5' : ''}`} />
          </button>
        </div>
        <p className="text-sm text-text-muted mb-4">
          {notificationsBlocked
            ? 'Notifications are blocked by your browser. Please enable them in browser settings.'
            : 'Get daily reminders to check in to your groups.'}
        </p>

        {settings.notifications && !notificationsBlocked && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reminder-time" className="text-sm font-medium text-text">Reminder Time</label>
              <input
                id="reminder-time"
                type="time"
                value={settings.reminderTime || '09:00'}
                onChange={e => handleTimeChange(e.target.value)}
                className="text-sm px-3 py-2 rounded-[var(--radius-sm)] border border-border-input bg-background text-text font-body focus-visible:outline-2 focus-visible:outline-primary w-fit"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text">Reminder Days</label>
              <div className="flex gap-1.5">
                {DAY_NAMES.map((day, i) => {
                  const isActive = (settings.reminderDays || []).includes(i);
                  return (
                    <button
                      key={day}
                      className={`w-9 h-9 rounded-[var(--radius-sm)] text-xs font-semibold border cursor-pointer transition-all duration-150 ${isActive ? 'bg-primary text-white border-primary' : 'bg-transparent text-text-secondary border-border hover:bg-hover-bg'}`}
                      onClick={() => handleDayToggle(i)}
                      aria-label={`${day}: ${isActive ? 'on' : 'off'}`}
                      aria-pressed={isActive}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text">Daily Summary</span>
              <p className="text-xs text-text-muted">A summary notification is sent at the end of each reminder day if you haven&apos;t checked in yet.</p>
            </div>
          </div>
        )}
      </section>

      <section className="bg-surface rounded-[var(--radius-md)] border border-border p-5">
        <h2 className="font-heading text-sm font-semibold text-text mb-1">Data Management</h2>
        <p className="text-sm text-text-muted mb-3">Export your data for backup or import previously saved data.</p>
        <div className="flex gap-3">
          <button className="font-heading text-sm font-semibold py-2 px-5 rounded-[var(--radius-md)] bg-primary text-white cursor-pointer border-none hover:bg-primary-dark transition-colors duration-150" onClick={onExport}>Export Data</button>
          <button className="font-heading text-sm font-semibold py-2 px-5 rounded-[var(--radius-md)] border border-border bg-background text-text cursor-pointer hover:bg-hover-bg transition-colors duration-150" onClick={onImport}>Import Data</button>
        </div>
      </section>
    </m.div>
  );
}
