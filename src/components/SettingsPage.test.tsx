import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SettingsPage from './SettingsPage';
import * as storage from '../services/storage';
import * as notifications from '../services/notifications';

vi.mock('../services/storage', () => ({
  loadSettings: vi.fn(() => ({
    startDate: '2026-07-05',
    notifications: true,
    programStartDate: '2026-07-05',
    lastPassDate: null,
    passHistory: [],
    reminderTime: '09:00',
    reminderDays: [0, 1, 2, 3, 4, 5, 6],
  })),
  saveSettings: vi.fn(),
}));

vi.mock('../services/notifications', () => ({
  requestNotificationPermission: vi.fn(async () => 'granted'),
  getNotificationPermission: vi.fn(() => 'granted'),
  toggleNotifications: vi.fn(),
  updateReminderSettings: vi.fn(),
}));

vi.mock('../services/nycTime', () => ({
  getToday: vi.fn(() => '2026-07-05'),
}));

describe('SettingsPage', () => {
  const onExport = vi.fn();
  const onImport = vi.fn();
  const onReset = vi.fn();
  const onSettingsChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the settings heading', () => {
    render(<SettingsPage onExport={onExport} onImport={onImport} onReset={onReset} onSettingsChange={onSettingsChange} />);
    expect(screen.getByText('Settings')).toBeDefined();
  });

  it('renders the Program Dates section', () => {
    render(<SettingsPage onExport={onExport} onImport={onImport} onReset={onReset} onSettingsChange={onSettingsChange} />);
    expect(screen.getByText('Program Dates')).toBeDefined();
  });

  it('renders the Data Management section', () => {
    render(<SettingsPage onExport={onExport} onImport={onImport} onReset={onReset} onSettingsChange={onSettingsChange} />);
    expect(screen.getByText('Data Management')).toBeDefined();
  });

  it('renders the Notifications & Reminders section', () => {
    render(<SettingsPage onExport={onExport} onImport={onImport} onReset={onReset} onSettingsChange={onSettingsChange} />);
    expect(screen.getByText('Notifications & Reminders')).toBeDefined();
  });

  it('renders Export and Import buttons', () => {
    render(<SettingsPage onExport={onExport} onImport={onImport} onReset={onReset} onSettingsChange={onSettingsChange} />);
    expect(screen.getByText('Export Data')).toBeDefined();
    expect(screen.getByText('Import Data')).toBeDefined();
  });

  it('calls onExport when Export Data is clicked', () => {
    render(<SettingsPage onExport={onExport} onImport={onImport} onReset={onReset} onSettingsChange={onSettingsChange} />);
    fireEvent.click(screen.getByText('Export Data'));
    expect(onExport).toHaveBeenCalled();
  });

  it('calls onImport when Import Data is clicked', () => {
    render(<SettingsPage onExport={onExport} onImport={onImport} onReset={onReset} onSettingsChange={onSettingsChange} />);
    fireEvent.click(screen.getByText('Import Data'));
    expect(onImport).toHaveBeenCalled();
  });

  it('shows reminder time when notifications are enabled', () => {
    render(<SettingsPage onExport={onExport} onImport={onImport} onReset={onReset} onSettingsChange={onSettingsChange} />);
    expect(screen.getByLabelText('Reminder Time')).toBeDefined();
  });

  it('shows day-of-week buttons', () => {
    render(<SettingsPage onExport={onExport} onImport={onImport} onReset={onReset} onSettingsChange={onSettingsChange} />);
    expect(screen.getByText('Sun')).toBeDefined();
    expect(screen.getByText('Mon')).toBeDefined();
    expect(screen.getByText('Sat')).toBeDefined();
  });

  it('calls toggleNotifications when notification toggle is clicked', () => {
    render(<SettingsPage onExport={onExport} onImport={onImport} onReset={onReset} onSettingsChange={onSettingsChange} />);
    const toggle = screen.getByRole('button', { name: /disable notifications/i });
    fireEvent.click(toggle);
    expect(notifications.toggleNotifications).toHaveBeenCalledWith(false);
  });

  it('calls updateReminderSettings when a day is toggled', () => {
    render(<SettingsPage onExport={onExport} onImport={onImport} onReset={onReset} onSettingsChange={onSettingsChange} />);
    fireEvent.click(screen.getByText('Wed'));
    expect(notifications.updateReminderSettings).toHaveBeenCalled();
  });
});
