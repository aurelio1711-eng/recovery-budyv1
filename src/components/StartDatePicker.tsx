import { useState } from 'react';
import { loadSettings, saveSettings } from '../services/storage';
import { getToday } from '../services/nycTime';
import { format, parseISO } from 'date-fns';
import type { Settings } from '../types';

interface StartDatePickerProps {
  onSettingsChange?: () => void;
}

export default function StartDatePicker({ onSettingsChange }: StartDatePickerProps) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = event.target.value;
    const updatedSettings: Settings = {
      ...settings,
      programStartDate: newStartDate,
      startDate: newStartDate,
    };
    saveSettings(updatedSettings);
    setSettings(updatedSettings);
    setShowDatePicker(false);
    if (onSettingsChange) onSettingsChange();
  };

  const getFormattedDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Not set';
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex-1">
      <h3 className="text-sm font-semibold text-text mb-1">Program Start Date</h3>
      <div className="text-base font-mono tabular-nums text-text py-1.5">
        {getFormattedDate(settings.programStartDate)}
      </div>
      <button
        className="text-xs font-semibold text-primary bg-transparent border-none cursor-pointer hover:text-primary-dark transition-colors duration-150 p-0"
        onClick={() => setShowDatePicker(!showDatePicker)}
      >
        Change Start Date
      </button>
      {showDatePicker && (
        <div className="mt-2">
          <input
            type="date"
            value={settings.programStartDate || ''}
            onChange={handleStartDateChange}
            min="2020-01-01"
            max={getToday()}
            className="text-sm px-2.5 py-1.5 rounded-[var(--radius-sm)] border border-border-input bg-background text-text font-body"
          />
        </div>
      )}
    </div>
  );
}
