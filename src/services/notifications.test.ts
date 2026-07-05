import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let mockPermission = 'default';
const mockNotificationInstances: { close: ReturnType<typeof vi.fn> }[] = [];

const MockNotification = vi.fn(function(this: { close: ReturnType<typeof vi.fn> }) {
  this.close = vi.fn();
  mockNotificationInstances.push(this);
}) as unknown as typeof Notification;

Object.defineProperty(MockNotification, 'permission', {
  get: () => mockPermission,
  configurable: true,
});

MockNotification.requestPermission = vi.fn(async () => {
  mockPermission = 'granted';
  return 'granted';
});

vi.mock('./storage', () => ({
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
  getCheckInsForDate: vi.fn(() => [
    { groupId: 'healthy-relationships', date: '2026-07-05', notes: '', timestamp: Date.now(), signature: null },
  ]),
  loadProgram: vi.fn(() => [
    { id: 'healthy-relationships', name: 'Healthy Relationships', required: 16, category: 'clinical', completed: 5 },
  ]),
}));

vi.mock('./nycTime', () => ({
  getToday: vi.fn(() => '2026-07-05'),
}));

describe('notifications service', () => {
  let originalNotification: typeof Notification | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPermission = 'default';
    mockNotificationInstances.length = 0;

    originalNotification = window.Notification;
    Object.defineProperty(window, 'Notification', {
      value: MockNotification,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    if (originalNotification !== undefined) {
      Object.defineProperty(window, 'Notification', {
        value: originalNotification,
        writable: true,
        configurable: true,
      });
    }
  });

  describe('getNotificationPermission', () => {
    it('returns the current permission state', async () => {
      mockPermission = 'granted';
      const { getNotificationPermission } = await import('./notifications');
      expect(getNotificationPermission()).toBe('granted');
    });

    it('returns denied when Notification is not in window', async () => {
      const original = window.Notification;
      // @ts-expect-error testing absence
      delete window.Notification;
      const { getNotificationPermission } = await import('./notifications');
      expect(getNotificationPermission()).toBe('denied');
      window.Notification = original;
    });
  });

  describe('requestNotificationPermission', () => {
    it('returns granted when already granted', async () => {
      mockPermission = 'granted';
      const { requestNotificationPermission } = await import('./notifications');
      expect(await requestNotificationPermission()).toBe('granted');
    });

    it('returns denied when Notification is not in window', async () => {
      const original = window.Notification;
      // @ts-expect-error testing absence
      delete window.Notification;
      const { requestNotificationPermission } = await import('./notifications');
      expect(await requestNotificationPermission()).toBe('denied');
      window.Notification = original;
    });
  });

  describe('sendNotification', () => {
    it('creates a Notification when permission is granted', async () => {
      mockPermission = 'granted';
      const { sendNotification } = await import('./notifications');
      sendNotification('Test Title', { body: 'Test body' });
      expect(MockNotification).toHaveBeenCalledWith('Test Title', expect.objectContaining({
        body: 'Test body',
        tag: 'recovery-buddy',
      }));
    });

    it('does not create Notification when permission is denied', async () => {
      mockPermission = 'denied';
      const { sendNotification } = await import('./notifications');
      vi.mocked(MockNotification).mockClear();
      sendNotification('Test Title');
      expect(MockNotification).not.toHaveBeenCalled();
    });
  });

  describe('toggleNotifications', () => {
    it('saves settings with notifications enabled', async () => {
      mockPermission = 'granted';
      const { toggleNotifications } = await import('./notifications');
      const { saveSettings } = await import('./storage');
      toggleNotifications(true);
      expect(saveSettings).toHaveBeenCalled();
      const saved = vi.mocked(saveSettings).mock.calls[0][0];
      expect(saved.notifications).toBe(true);
    });

    it('saves settings with notifications disabled', async () => {
      const { toggleNotifications } = await import('./notifications');
      const { saveSettings } = await import('./storage');
      toggleNotifications(false);
      expect(saveSettings).toHaveBeenCalled();
      const saved = vi.mocked(saveSettings).mock.calls[0][0];
      expect(saved.notifications).toBe(false);
    });
  });

  describe('updateReminderSettings', () => {
    it('saves the reminder time and days', async () => {
      const { updateReminderSettings } = await import('./notifications');
      const { saveSettings } = await import('./storage');
      updateReminderSettings('10:30', [1, 3, 5]);
      expect(saveSettings).toHaveBeenCalled();
      const saved = vi.mocked(saveSettings).mock.calls[0][0];
      expect(saved.reminderTime).toBe('10:30');
      expect(saved.reminderDays).toEqual([1, 3, 5]);
    });
  });

  describe('initializeNotifications', () => {
    it('does not throw when called', async () => {
      mockPermission = 'granted';
      const { initializeNotifications } = await import('./notifications');
      expect(() => initializeNotifications()).not.toThrow();
    });
  });

  describe('sendDailySummary', () => {
    it('does not throw when called', async () => {
      mockPermission = 'granted';
      const { sendDailySummary } = await import('./notifications');
      expect(() => sendDailySummary()).not.toThrow();
    });
  });
});
