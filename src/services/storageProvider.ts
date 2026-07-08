import * as local from './storage';
import * as cloud from './supabaseStorage';
import { enqueueForSync } from './syncService';
import { getToday } from './nycTime';
import type { Group, CheckIn, CheckInsRecord, Settings, ExportData, ImportValidation } from '../types';

let syncEnabled = false;
let currentUserId: string | null = null;

export function setSyncEnabled(enabled: boolean, userId: string | null) {
  syncEnabled = enabled;
  currentUserId = userId;
}

export function isSyncEnabled(): boolean {
  return syncEnabled && !!currentUserId;
}

export function getCurrentUserId(): string | null {
  return currentUserId;
}

// ── Program / Groups ────────────────────────────────────

export function loadProgram(): Group[] | null {
  return local.loadProgram();
}

export function saveProgram(groups: Group[]): boolean {
  const ok = local.saveProgram(groups);
  if (ok && syncEnabled && currentUserId) {
    cloud.saveProgram(currentUserId, groups).catch(() => {
      enqueueForSync(currentUserId!, 'saveProgram', groups);
    });
  }
  return ok;
}

// ── Check-Ins ───────────────────────────────────────────

export function addCheckIn(
  groupId: string,
  date: string,
  notes: string,
  signature: string | null,
): CheckIn {
  const checkIn = local.addCheckIn(groupId, date, notes, signature);
  if (syncEnabled && currentUserId) {
    cloud.addCheckIn(currentUserId, groupId, date, notes, checkIn.timestamp, signature).catch(() => {
      enqueueForSync(currentUserId!, 'addCheckIn', { groupId, date, notes, timestamp: checkIn.timestamp, signature });
    });
  }
  return checkIn;
}

export function removeCheckIn(groupId: string, date: string = getToday()): void {
  local.removeCheckIn(groupId, date);
  if (syncEnabled && currentUserId) {
    cloud.removeCheckIn(currentUserId, groupId, date).catch(() => {
      enqueueForSync(currentUserId!, 'removeCheckIn', { groupId, date });
    });
  }
}

export function hasCheckIn(groupId: string, date: string = getToday()): boolean {
  return local.hasCheckIn(groupId, date);
}

export function getCheckInsForDate(date: string = getToday()): CheckIn[] {
  return local.getCheckInsForDate(date);
}

// ── Settings ────────────────────────────────────────────

export function loadSettings(): Settings {
  return local.loadSettings();
}

export function saveSettings(settings: Settings): boolean {
  const ok = local.saveSettings(settings);
  if (ok && syncEnabled && currentUserId) {
    cloud.saveSettings(currentUserId, settings).catch(() => {
      enqueueForSync(currentUserId!, 'saveSettings', settings);
    });
  }
  return ok;
}

export function updatePassStatus(date: string = getToday()): Settings {
  const s = local.updatePassStatus(date);
  if (syncEnabled && currentUserId) {
    cloud.saveSettings(currentUserId, s).catch(() => {
      enqueueForSync(currentUserId!, 'saveSettings', s);
    });
  }
  return s;
}

// ── Pass / Date helpers ─────────────────────────────────

export { getDaysSinceProgramStart, getDaysUntilNextPass, getNextPassDate, isEligibleForPass, getWeekRange } from './storage';

// ── Export / Import ─────────────────────────────────────

export function exportData(): ExportData {
  return local.exportData();
}

export function validateImportData(data: unknown): ImportValidation {
  return local.validateImportData(data);
}

export function importData(data: unknown): ImportValidation {
  return local.importData(data);
}

// ── Cloud-only operations ───────────────────────────────

export async function pullFromCloud(userId: string): Promise<void> {
  const [cloudGroups, cloudCheckIns, cloudSettings] = await Promise.all([
    cloud.loadProgram(userId),
    cloud.loadCheckIns(userId),
    cloud.loadSettings(userId),
  ]);

  if (cloudGroups) local.saveProgram(cloudGroups);
  if (cloudCheckIns && Object.keys(cloudCheckIns).length > 0) local.saveCheckIns(cloudCheckIns);
  if (cloudSettings) local.saveSettings(cloudSettings);
}

export async function pushToCloud(userId: string): Promise<void> {
  const prog = local.loadProgram();
  const checks = local.loadCheckIns();
  const settings = local.loadSettings();

  const promises: Promise<unknown>[] = [];

  if (prog) promises.push(cloud.saveProgram(userId, prog));

  if (checks) {
    for (const [, checkIn] of Object.entries(checks)) {
      const exists = cloud.addCheckIn(userId, checkIn.groupId, checkIn.date, checkIn.notes, checkIn.timestamp, checkIn.signature);
      promises.push(exists);
    }
  }

  if (settings) promises.push(cloud.saveSettings(userId, settings));

  await Promise.allSettled(promises);
}

export async function getHasCloudData(userId: string): Promise<boolean> {
  const [groups, checkIns, settings] = await Promise.all([
    cloud.loadProgram(userId),
    cloud.loadCheckIns(userId),
    cloud.loadSettings(userId),
  ]);
  return !!(groups?.length || (checkIns && Object.keys(checkIns).length > 0) || settings);
}

export async function clearLocalAndPullFromCloud(userId: string): Promise<void> {
  local.clearAllData();
  await pullFromCloud(userId);
}
