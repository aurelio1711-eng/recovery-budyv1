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
    const uid = currentUserId;
    cloud.saveProgram(uid, groups).catch((error) => {
      console.error('StorageProvider: saveProgram failed, enqueueing sync', error);
      enqueueForSync(uid, 'saveProgram', groups);
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
    const uid = currentUserId;
    cloud.addCheckIn(uid, groupId, date, notes, checkIn.timestamp, signature).catch((error) => {
      console.error('StorageProvider: addCheckIn failed, enqueueing sync', error);
      enqueueForSync(uid, 'addCheckIn', { groupId, date, notes, timestamp: checkIn.timestamp, signature });
    });
  }
  return checkIn;
}

export function removeCheckIn(groupId: string, date: string = getToday()): void {
  local.removeCheckIn(groupId, date);
  if (syncEnabled && currentUserId) {
    const uid = currentUserId;
    cloud.removeCheckIn(uid, groupId, date).catch((error) => {
      console.error('StorageProvider: removeCheckIn failed, enqueueing sync', error);
      enqueueForSync(uid, 'removeCheckIn', { groupId, date });
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
    const uid = currentUserId;
    cloud.saveSettings(uid, settings).catch((error) => {
      console.error('StorageProvider: saveSettings failed, enqueueing sync', error);
      enqueueForSync(uid, 'saveSettings', settings);
    });
  }
  return ok;
}

export function updatePassStatus(date: string = getToday()): Settings {
  const s = local.updatePassStatus(date);
  if (syncEnabled && currentUserId) {
    const uid = currentUserId;
    cloud.saveSettings(uid, s).catch((error) => {
      console.error('StorageProvider: updatePassStatus failed, enqueueing sync', error);
      enqueueForSync(uid, 'saveSettings', s);
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

  if (cloudGroups) local.mergeProgram(cloudGroups);
  if (cloudCheckIns && Object.keys(cloudCheckIns).length > 0) local.mergeCheckIns(cloudCheckIns);
  if (cloudSettings) local.mergeSettings(cloudSettings);
}

export async function pushToCloud(userId: string): Promise<void> {
  const [cloudGroups, cloudCheckIns, cloudSettings] = await Promise.all([
    cloud.loadProgram(userId),
    cloud.loadCheckIns(userId),
    cloud.loadSettings(userId),
  ]);

  const localProg = local.loadProgram();
  const localChecks = local.loadCheckIns();
  const localSettings = local.loadSettings();

  // Merge local into cloud data first
  const mergedProg = cloudGroups ? [...cloudGroups] : [];
  if (localProg) {
    const map = new Map<string, Group>();
    for (const g of mergedProg) map.set(g.id, g);
    for (const g of localProg) {
      const existing = map.get(g.id);
      if (existing) {
        existing.completed = Math.max(existing.completed, g.completed);
      } else {
        map.set(g.id, g);
      }
    }
    mergedProg.length = 0;
    mergedProg.push(...map.values());
  }

  const mergedCheckIns = cloudCheckIns ? { ...cloudCheckIns } : {};
  if (localChecks) {
    for (const [key, ci] of Object.entries(localChecks)) {
      if (!mergedCheckIns[key] || (ci.timestamp || 0) > (mergedCheckIns[key].timestamp || 0)) {
        mergedCheckIns[key] = ci;
      }
    }
  }

  const mergedSettings = cloudSettings || localSettings || undefined;

  const promises: Promise<unknown>[] = [];

  if (mergedProg.length > 0) promises.push(cloud.saveProgram(userId, mergedProg));
  if (mergedCheckIns) {
    const allCheckInKeys = [...new Set([
      ...Object.keys(cloudCheckIns || {}),
      ...Object.keys(localChecks || {}),
    ])];
    for (const key of allCheckInKeys) {
      const ci = mergedCheckIns[key];
      if (ci) {
        promises.push(cloud.addCheckIn(userId, ci.groupId, ci.date, ci.notes, ci.timestamp, ci.signature));
      }
    }
  }
  if (mergedSettings) promises.push(cloud.saveSettings(userId, mergedSettings));

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


