import { getToday } from './nycTime';
import { parseISO, differenceInDays, addDays, format, isAfter, startOfWeek, endOfWeek } from 'date-fns';
import type { Group, CheckIn, CheckInsRecord, Settings, ExportData, ImportValidation } from '../types';
import { PROGRAM_VERSION } from '../data/programData';

const STORAGE_KEY = 'clinical-program-tracker';
const CHECKINS_KEY = 'clinical-program-checkins';
const SETTINGS_KEY = 'clinical-program-settings';
const PROGRAM_VERSION_KEY = 'program-version';

export const loadProgram = (): Group[] | null => {
  try {
    const version = localStorage.getItem(PROGRAM_VERSION_KEY);
    if (version !== String(PROGRAM_VERSION)) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(PROGRAM_VERSION_KEY, String(PROGRAM_VERSION));
      return null;
    }
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
    return null;
  } catch (e) {
    console.error('Failed to load program:', e);
    return null;
  }
};

export const saveProgram = (groups: Group[]): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
    localStorage.setItem(PROGRAM_VERSION_KEY, String(PROGRAM_VERSION));
    return true;
  } catch (e) {
    console.error('Failed to save program:', e);
    return false;
  }
};

export const loadCheckIns = (): CheckInsRecord => {
  try {
    const data = localStorage.getItem(CHECKINS_KEY);
    if (data) return JSON.parse(data);
    return {};
  } catch (e) {
    console.error('Failed to load check-ins:', e);
    return {};
  }
};

function getStorageSize(key: string): number {
  const item = localStorage.getItem(key);
  return item ? new Blob([item]).size : 0;
}

const MAX_STORAGE_SIZE = 4 * 1024 * 1024;

export const saveCheckIns = (checkIns: CheckInsRecord): boolean => {
  try {
    const serialized = JSON.stringify(checkIns);
    if (new Blob([serialized]).size > MAX_STORAGE_SIZE) {
      console.error('Check-in data exceeds storage limit — save rejected');
      return false;
    }
    localStorage.setItem(CHECKINS_KEY, serialized);
    return true;
  } catch (e) {
    console.error('Failed to save check-ins:', e);
    return false;
  }
};

const VALID_SIGNATURE_PREFIX = 'data:image/png;base64,';
const MAX_SIGNATURE_SIZE = 500 * 1024;

function isValidSignature(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value !== 'string') return false;
  if (!value.startsWith(VALID_SIGNATURE_PREFIX)) return false;
  if (value.length > MAX_SIGNATURE_SIZE) return false;
  return true;
}

export const addCheckIn = (groupId: string, date: string = getToday(), notes: string = '', signature: string | null = null): CheckIn => {
  if (!isValidSignature(signature)) {
    console.error('Invalid signature data — rejected');
    signature = null;
  }
  const checkIns = loadCheckIns();
  const key = `${groupId}-${date}`;
  checkIns[key] = { groupId, date, notes, timestamp: Date.now(), signature };
  saveCheckIns(checkIns);
  return checkIns[key];
};

export const removeCheckIn = (groupId: string, date: string = getToday()): void => {
  const checkIns = loadCheckIns();
  const key = `${groupId}-${date}`;
  delete checkIns[key];
  saveCheckIns(checkIns);
};

export const hasCheckIn = (groupId: string, date: string = getToday()): boolean => {
  const checkIns = loadCheckIns();
  return !!checkIns[`${groupId}-${date}`];
};

export const getCheckInsForDate = (date: string = getToday()): CheckIn[] => {
  const checkIns = loadCheckIns();
  return Object.values(checkIns).filter(c => c.date === date);
};

export const loadSettings = (): Settings => {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      const parsed: Partial<Settings> = JSON.parse(data);
      const today = getToday();
      const merged: Settings = { startDate: today, notifications: true, programStartDate: today, lastPassDate: null, passHistory: [], reminderTime: '09:00', reminderDays: [1, 2, 3, 4, 5, 6, 0], ...parsed };
      return merged;
    }
    return {
      startDate: getToday(),
      notifications: true,
      programStartDate: getToday(),
      lastPassDate: null,
      passHistory: [],
      reminderTime: '09:00',
      reminderDays: [1, 2, 3, 4, 5, 6, 0],
    };
  } catch (e) {
    const today = getToday();
    return {
      startDate: today,
      notifications: true,
      programStartDate: today,
      lastPassDate: null,
      passHistory: [],
      reminderTime: '09:00',
      reminderDays: [1, 2, 3, 4, 5, 6, 0],
    };
  }
};

export const saveSettings = (settings: Settings): boolean => {
  try {
    const normalized: Settings = {
      startDate: settings.startDate,
      notifications: settings.notifications || true,
      programStartDate: settings.programStartDate,
      lastPassDate: settings.lastPassDate,
      passHistory: settings.passHistory || [],
      passHistoryLabels: settings.passHistoryLabels || [],
      reminderTime: settings.reminderTime || '09:00',
      reminderDays: settings.reminderDays || [1, 2, 3, 4, 5, 6, 0],
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalized));
    return true;
  } catch (e) {
    console.error('Failed to save settings:', e);
    return false;
  }
};

export const clearAllData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(CHECKINS_KEY);
  localStorage.removeItem(SETTINGS_KEY);
};

export const updatePassStatus = (date: string = getToday()): Settings => {
  const settings = loadSettings();
  settings.lastPassDate = date;
  settings.passHistory = [...(settings.passHistory || []), date];
  saveSettings(settings);
  return settings;
};

export const getDaysSinceProgramStart = (): number => {
  const settings = loadSettings();
  const startDate = settings.programStartDate;
  if (!startDate) return 0;

  const start = parseISO(startDate);
  const today = parseISO(getToday());

  return Math.max(0, differenceInDays(today, start));
};

export const getDaysUntilNextPass = (): number => {
  const daysSinceStart = getDaysSinceProgramStart();
  if (daysSinceStart < 30) {
    return 30 - daysSinceStart;
  }

  const settings = loadSettings();
  const lastPassDate = settings.lastPassDate;

  if (!lastPassDate) {
    return 0;
  }

  const lastPass = parseISO(lastPassDate);
  const nextPassDate = addDays(lastPass, 30);
  const today = parseISO(getToday());

  return Math.max(0, differenceInDays(nextPassDate, today));
};

export const getNextPassDate = (): string | null => {
  const daysUntilPass = getDaysUntilNextPass();
  if (daysUntilPass === 0) return null;

  const today = parseISO(getToday());
  return format(addDays(today, daysUntilPass), 'yyyy-MM-dd');
};

export const getWeekRange = (dateStr: string = getToday()): { start: string; end: string } => {
  const d = parseISO(dateStr);
  const monday = startOfWeek(d, { weekStartsOn: 1 });
  const sunday = endOfWeek(d, { weekStartsOn: 1 });
  return {
    start: format(monday, 'yyyy-MM-dd'),
    end: format(sunday, 'yyyy-MM-dd'),
  };
};

export const isEligibleForPass = (): boolean => {
  const daysSinceStart = getDaysSinceProgramStart();
  return daysSinceStart >= 30;
};

export const exportData = (): ExportData => {
  return {
    program: loadProgram() as Group[],
    checkIns: loadCheckIns(),
    settings: loadSettings(),
    exportDate: new Date().toISOString(),
  };
};

const IMPORT_SCHEMA = {
  program: {
    required: true,
    validate: (data: unknown): boolean =>
      Array.isArray(data) && data.every(g =>
        g && typeof (g as Record<string, unknown>).id === 'string' &&
        typeof (g as Record<string, unknown>).name === 'string' &&
        typeof (g as Record<string, unknown>).category === 'string' &&
        typeof (g as Record<string, unknown>).required === 'number' &&
        typeof (g as Record<string, unknown>).completed === 'number'
      )
  },
  checkIns: {
    required: true,
    validate: (data: unknown): boolean =>
      typeof data === 'object' && data !== null && Object.values(data).every(c =>
        c && typeof (c as Record<string, unknown>).groupId === 'string' &&
        typeof (c as Record<string, unknown>).date === 'string' &&
        typeof (c as Record<string, unknown>).timestamp === 'number'
      )
  },
  settings: {
    required: true,
    validate: (data: unknown): boolean =>
      !!data && typeof data === 'object' &&
      typeof (data as Record<string, unknown>).startDate === 'string' &&
      typeof (data as Record<string, unknown>).notifications === 'boolean' &&
      typeof (data as Record<string, unknown>).programStartDate === 'string' &&
      ((data as Record<string, unknown>).lastPassDate === null || typeof (data as Record<string, unknown>).lastPassDate === 'string') &&
      Array.isArray((data as Record<string, unknown>).passHistory)
  }
};

export const validateImportData = (data: unknown): ImportValidation => {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid import: expected an object'] };
  }

  for (const [key, schema] of Object.entries(IMPORT_SCHEMA)) {
    if (schema.required && !(data as Record<string, unknown>)[key]) {
      errors.push(`Missing required field: ${key}`);
      continue;
    }
    if ((data as Record<string, unknown>)[key] && !schema.validate((data as Record<string, unknown>)[key])) {
      errors.push(`Invalid data format for: ${key}`);
    }
  }

  return { valid: errors.length === 0, errors };
};

export function mergeProgram(imported: Group[]): void {
  const existing = loadProgram() || [];
  const map = new Map<string, Group>();
  for (const g of existing) map.set(g.id, g);
  for (const g of imported) {
    const existing_g = map.get(g.id);
    if (existing_g) {
      existing_g.completed = Math.max(existing_g.completed, g.completed);
      if (g.note) existing_g.note = g.note;
      if (g.time) existing_g.time = g.time;
      if (g.name) existing_g.name = g.name;
    } else {
      map.set(g.id, { ...g });
    }
  }
  saveProgram(Array.from(map.values()));
}

export function mergeCheckIns(imported: CheckInsRecord): void {
  const existing = loadCheckIns();
  for (const [key, ci] of Object.entries(imported)) {
    if (!existing[key] || (ci.timestamp || 0) > (existing[key].timestamp || 0)) {
      existing[key] = ci;
    }
  }
  saveCheckIns(existing);
}

export function mergeSettings(imported: Settings): void {
  const existing = loadSettings();
  existing.startDate = existing.startDate < imported.startDate ? existing.startDate : imported.startDate;
  existing.programStartDate = existing.programStartDate < imported.programStartDate ? existing.programStartDate : imported.programStartDate;
  const mergedPassHistory = [...new Set([...existing.passHistory, ...imported.passHistory])];
  existing.passHistory = mergedPassHistory;
  if (imported.lastPassDate && (!existing.lastPassDate || imported.lastPassDate > existing.lastPassDate)) {
    existing.lastPassDate = imported.lastPassDate;
  }
  saveSettings(existing);
}

export const importData = (data: unknown): ImportValidation => {
  const validation = validateImportData(data);
  if (!validation.valid) {
    console.error('Import validation failed:', validation.errors);
    throw new Error(`Invalid import data: ${validation.errors.join(', ')}`);
  }

  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (d.program) mergeProgram(d.program as Group[]);
    if (d.checkIns) mergeCheckIns(d.checkIns as CheckInsRecord);
    if (d.settings) mergeSettings(d.settings as Settings);
  }

  return validation;
};
