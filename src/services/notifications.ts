import { loadSettings, saveSettings, getCheckInsForDate, loadProgram } from './storage';
import { getToday } from './nycTime';

const REMINDER_CHECK_KEY = 'recovery-buddy-reminder-last-check';
const DAILY_NOTIF_KEY = 'recovery-buddy-daily-notif-sent';

export type NotificationPermissionState = 'granted' | 'denied' | 'default';

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  return result as NotificationPermissionState;
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission as NotificationPermissionState;
}

export function sendNotification(title: string, options?: NotificationOptions): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: 'recovery-buddy',
      ...options,
    });
  } catch {
    // SW-only environments may not support new Notification()
  }
}

function hasCheckedInToday(): boolean {
  const todayCheckIns = getCheckInsForDate(getToday());
  return todayCheckIns.length > 0;
}

function getNextReminderTime(reminderTime: string, reminderDays: number[]): { hours: number; minutes: number } | null {
  const [hours, minutes] = reminderTime.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;

  const now = new Date();
  const today = now.getDay();

  if (!reminderDays.includes(today)) {
    const nextDay = reminderDays
      .map(d => ({ day: d, diff: (d - today + 7) % 7 || 7 }))
      .sort((a, b) => a.diff - b.diff)[0];
    if (!nextDay) return null;
    return { hours, minutes };
  }

  return { hours, minutes };
}

export function scheduleReminder(): void {
  const settings = loadSettings();
  if (!settings.notifications || !settings.reminderTime) return;

  const { hours, minutes } = getNextReminderTime(settings.reminderTime, settings.reminderDays) || {};
  if (hours === undefined) return;

  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  const delay = target.getTime() - now.getTime();
  if (delay > 0 && delay < 86400000) {
    setTimeout(() => {
      if (!hasCheckedInToday()) {
        sendNotification('Recovery Buddy Reminder', {
          body: 'Don\'t forget to check in to your groups today!',
          requireInteraction: true,
        });
      }
      localStorage.setItem(REMINDER_CHECK_KEY, getToday());
      scheduleReminder();
    }, delay);
  }
}

export function sendDailySummary(): void {
  const settings = loadSettings();
  if (!settings.notifications) return;

  const today = getToday();
  const lastSent = localStorage.getItem(DAILY_NOTIF_KEY);
  if (lastSent === today) return;

  const checkIns = getCheckInsForDate(today);
  const groups = loadProgram() || [];

  if (checkIns.length > 0) {
    const groupNames = checkIns.map(ci => {
      const g = groups.find(gr => gr.id === ci.groupId);
      return g ? g.name : ci.groupId;
    });

    sendNotification('Recovery Buddy - Daily Summary', {
      body: `You checked in to ${checkIns.length} session${checkIns.length > 1 ? 's' : ''} today: ${groupNames.join(', ')}`,
    });
  } else {
    sendNotification('Recovery Buddy', {
      body: 'No check-ins recorded today. Time to attend a group session!',
    });
  }

  localStorage.setItem(DAILY_NOTIF_KEY, today);
}

export function scheduleEndOfDayReminder(): void {
  const settings = loadSettings();
  if (!settings.notifications) return;

  const now = new Date();
  const today = now.getDay();

  if (!settings.reminderDays.includes(today)) return;

  const endOfDay = new Date();
  endOfDay.setHours(20, 0, 0, 0);

  if (endOfDay > now && !hasCheckedInToday()) {
    const delay = endOfDay.getTime() - now.getTime();
    setTimeout(() => {
      if (!hasCheckedInToday()) {
        sendNotification('Recovery Buddy - Evening Reminder', {
          body: 'You haven\'t checked in yet today. Don\'t forget your session!',
          requireInteraction: true,
        });
      }
    }, delay);
  }
}

export function initializeNotifications(): void {
  const settings = loadSettings();
  if (!settings.notifications) return;

  if (getNotificationPermission() === 'granted') {
    scheduleReminder();
    scheduleEndOfDayReminder();
  }
}

export function toggleNotifications(enabled: boolean): void {
  const settings = loadSettings();
  settings.notifications = enabled;
  saveSettings(settings);

  if (enabled && getNotificationPermission() === 'granted') {
    scheduleReminder();
    scheduleEndOfDayReminder();
  }
}

export function updateReminderSettings(time: string, days: number[]): void {
  const settings = loadSettings();
  settings.reminderTime = time;
  settings.reminderDays = days;
  saveSettings(settings);

  if (settings.notifications && getNotificationPermission() === 'granted') {
    scheduleReminder();
    scheduleEndOfDayReminder();
  }
}
