import * as cloud from './supabaseStorage';

const SYNC_QUEUE_KEY = 'sync-queue';

interface SyncQueueItem {
  id: string;
  type: 'saveProgram' | 'addCheckIn' | 'removeCheckIn' | 'saveSettings';
  userId: string;
  payload: unknown;
  timestamp: number;
  retries: number;
  nextAttempt?: number;
}

function getQueue(): SyncQueueItem[] {
  try {
    const data = localStorage.getItem(SYNC_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: SyncQueueItem[]): void {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to save sync queue:', e);
  }
}

function enqueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries' | 'nextAttempt'>): void {
  const queue = getQueue();
  queue.push({ ...item, id: crypto.randomUUID(), timestamp: Date.now(), retries: 0, nextAttempt: Date.now() });
  saveQueue(queue);
}

function dequeue(id: string): void {
  const queue = getQueue().filter((q) => q.id !== id);
  saveQueue(queue);
}

const MAX_RETRIES = 5;
const BASE_RETRY_DELAY = 1000; // 1s
const MAX_RETRY_DELAY = 60 * 1000; // 60s

function computeBackoff(retries: number) {
  const exp = Math.min(MAX_RETRY_DELAY, BASE_RETRY_DELAY * 2 ** retries);
  const jitter = Math.floor(Math.random() * 1000);
  return exp + jitter;
}

async function processItem(item: SyncQueueItem): Promise<boolean> {
  const { userId, type, payload } = item;

  try {
    switch (type) {
      case 'saveProgram':
        await cloud.saveProgram(userId, payload as Parameters<typeof cloud.saveProgram>[1]);
        return true;
      case 'addCheckIn': {
        const p = payload as { groupId: string; date: string; notes: string; timestamp: number; signature: string | null };
        await cloud.addCheckIn(userId, p.groupId, p.date, p.notes, p.timestamp, p.signature);
        return true;
      }
      case 'removeCheckIn': {
        const p = payload as { groupId: string; date: string };
        await cloud.removeCheckIn(userId, p.groupId, p.date);
        return true;
      }
      case 'saveSettings':
        await cloud.saveSettings(userId, payload as Parameters<typeof cloud.saveSettings>[1]);
        return true;
      default:
        return false;
    }
  } catch (err) {
    // Log full error for diagnostics
    // eslint-disable-next-line no-console
    console.error('SyncService: failed to process item', { item, error: err });
    return false;
  }
}

let flushing = false;

export async function flushSyncQueue(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    const now = Date.now();
    const queue = getQueue();
    if (queue.length === 0) return;

    for (const item of queue) {
      if (item.nextAttempt && item.nextAttempt > now) continue; // not due yet

      const success = await processItem(item);
      if (success) {
        dequeue(item.id);
        continue;
      }

      // failed
      if (item.retries >= MAX_RETRIES) {
        console.warn(`Sync item ${item.id} exceeded max retries, dropping`);
        dequeue(item.id);
        continue;
      }

      // schedule next attempt with exponential backoff + jitter
      item.retries++;
      item.nextAttempt = Date.now() + computeBackoff(item.retries);
      const updated = getQueue().map((q) => (q.id === item.id ? item : q));
      saveQueue(updated);
    }
  } finally {
    flushing = false;
  }
}

// Called by storageProvider when a write fails
export function enqueueForSync(
  userId: string,
  type: SyncQueueItem['type'],
  payload: unknown,
): void {
  enqueue({ type, userId, payload });
}

export function getQueueLength(): number {
  return getQueue().length;
}

export function hasPendingSync(): boolean {
  return getQueueLength() > 0;
}
