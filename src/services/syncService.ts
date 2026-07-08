import * as cloud from './supabaseStorage';

const SYNC_QUEUE_KEY = 'sync-queue';

interface SyncQueueItem {
  id: string;
  type: 'saveProgram' | 'addCheckIn' | 'removeCheckIn' | 'saveSettings';
  userId: string;
  payload: unknown;
  timestamp: number;
  retries: number;
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

function enqueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>): void {
  const queue = getQueue();
  queue.push({ ...item, id: crypto.randomUUID(), timestamp: Date.now(), retries: 0 });
  saveQueue(queue);
}

function dequeue(id: string): void {
  const queue = getQueue().filter((q) => q.id !== id);
  saveQueue(queue);
}

const MAX_RETRIES = 5;

async function processItem(item: SyncQueueItem): Promise<boolean> {
  const { userId, type, payload } = item;

  try {
    switch (type) {
      case 'saveProgram':
        return !!(await cloud.saveProgram(userId, payload as Parameters<typeof cloud.saveProgram>[1]));
      case 'addCheckIn': {
        const p = payload as { groupId: string; date: string; notes: string; timestamp: number; signature: string | null };
        return !!(await cloud.addCheckIn(userId, p.groupId, p.date, p.notes, p.timestamp, p.signature));
      }
      case 'removeCheckIn': {
        const p = payload as { groupId: string; date: string };
        return !!(await cloud.removeCheckIn(userId, p.groupId, p.date));
      }
      case 'saveSettings':
        return !!(await cloud.saveSettings(userId, payload as Parameters<typeof cloud.saveSettings>[1]));
      default:
        return false;
    }
  } catch {
    return false;
  }
}

export async function flushSyncQueue(): Promise<void> {
  const queue = getQueue();
  if (queue.length === 0) return;

  for (const item of queue) {
    const success = await processItem(item);
    if (success) {
      dequeue(item.id);
    } else if (item.retries >= MAX_RETRIES) {
      console.warn(`Sync item ${item.id} exceeded max retries, dropping`);
      dequeue(item.id);
    } else {
      item.retries++;
      saveQueue(getQueue().map((q) => (q.id === item.id ? item : q)));
    }
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
