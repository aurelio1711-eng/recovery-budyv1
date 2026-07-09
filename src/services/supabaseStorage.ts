import { getSupabase } from '../lib/supabaseClient';
import type { Group, CheckIn, Settings, CheckInsRecord } from '../types';

const SIGNATURES_BUCKET = 'signatures';

function uploadSignature(userId: string, checkInId: string, dataUrl: string): Promise<string | null> {
  const base64 = dataUrl.split(',')[1];
  const buffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const path = `${userId}/${checkInId}.png`;

  return getSupabase().storage
    .from(SIGNATURES_BUCKET)
    .upload(path, buffer, { contentType: 'image/png', upsert: true })
    .then(({ error }) => (error ? (console.error('Signature upload failed:', error), null) : path));
}

function getSignatureUrl(path: string): Promise<string | null> {
  return getSupabase().storage
    .from(SIGNATURES_BUCKET)
    .createSignedUrl(path, 24 * 60 * 60)
    .then(({ data, error }) => (error ? (console.error('Signature URL error:', error), null) : data?.signedUrl ?? null));
}

// ── Groups ──────────────────────────────────────────────

export async function loadProgram(userId: string): Promise<Group[] | null> {
  const { data, error } = await getSupabase()
    .from('program_groups')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });

  if (error) { console.error('Failed to load program:', error); return null; }
  return data ?? null;
}

export async function saveProgram(userId: string, groups: Group[]): Promise<boolean> {
  const records = groups.map((g, i) => ({
    user_id: userId,
    group_id: g.id,
    name: g.name,
    required: g.required,
    completed: g.completed,
    category: g.category,
    recurring: g.recurring ?? false,
    note: g.note ?? null,
    custom: g.custom ?? false,
    time: g.time ?? null,
    sort_order: i,
  }));

  const { error } = await getSupabase().from('program_groups').upsert(records, {
    onConflict: 'user_id,group_id',
    ignoreDuplicates: false,
  });

  if (error) {
    throw new Error(`Failed to save program: ${error.message}`);
  }

  return true;
}

// ── Check-Ins ───────────────────────────────────────────

export async function loadCheckIns(userId: string): Promise<CheckInsRecord> {
  const { data, error } = await getSupabase()
    .from('check_ins')
    .select('*')
    .eq('user_id', userId);

  if (error) { console.error('Failed to load check-ins:', error); return {}; }

  const record: CheckInsRecord = {};
  (data ?? []).forEach((c) => {
    const key = `${c.group_id}-${c.date}`;
    record[key] = {
      id: c.id,
      groupId: c.group_id,
      date: c.date,
      notes: c.notes ?? '',
      timestamp: c.timestamp,
      signature: null,
      signature_path: c.signature_path ?? null,
      synced: true,
    };
  });

  const entries = Object.entries(record);
  for (let i = 0; i < entries.length; i++) {
    const [, checkIn] = entries[i];
    if (checkIn.signature_path) {
      const url = await getSignatureUrl(checkIn.signature_path);
      if (url) checkIn.signature = url;
    }
  }

  return record;
}

export async function addCheckIn(
  userId: string,
  groupId: string,
  date: string,
  notes: string,
  timestamp: number,
  signatureDataUrl: string | null,
): Promise<CheckIn> {
  const tempId = crypto.randomUUID();
  let signaturePath: string | null = null;

  if (signatureDataUrl) {
    signaturePath = await uploadSignature(userId, tempId, signatureDataUrl);
  }

  const { data, error } = await getSupabase()
    .from('check_ins')
    .insert({
      id: tempId,
      user_id: userId,
      group_id: groupId,
      date,
      notes,
      timestamp,
      signature_path: signaturePath,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to add check-in: ${error?.message ?? 'no data returned'}`);
  }

  return {
    id: data.id,
    groupId: data.group_id,
    date: data.date,
    notes: data.notes ?? '',
    timestamp: data.timestamp,
    signature: null,
    signature_path: data.signature_path ?? null,
    synced: true,
  };
}

export async function removeCheckIn(userId: string, groupId: string, date: string): Promise<boolean> {
  const { data: existing, error: loadError } = await getSupabase()
    .from('check_ins')
    .select('id, signature_path')
    .eq('user_id', userId)
    .eq('group_id', groupId)
    .eq('date', date)
    .single();

  if (loadError) {
    throw new Error(`Failed to load existing check-in: ${loadError.message}`);
  }

  if (!existing) return true;

  const { error } = await getSupabase()
    .from('check_ins')
    .delete()
    .eq('id', existing.id);

  if (error) {
    throw new Error(`Failed to remove check-in: ${error.message}`);
  }

  if (existing.signature_path) {
    getSupabase().storage.from(SIGNATURES_BUCKET).remove([existing.signature_path])
      .then(({ error: rmErr }) => { if (rmErr) console.error('Failed to remove signature:', rmErr); });
  }

  return true;
}

// ── Settings ────────────────────────────────────────────

export async function loadSettings(userId: string): Promise<Settings | null> {
  const { data, error } = await getSupabase()
    .from('settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) { console.error('Failed to load settings:', error); return null; }
  if (!data) return null;

  return {
    id: data.id,
    startDate: data.start_date,
    notifications: data.notifications,
    programStartDate: data.program_start_date,
    lastPassDate: data.last_pass_date,
    passHistory: data.pass_history ?? [],
    passHistoryLabels: data.pass_history_labels ?? [],
    reminderTime: data.reminder_time,
    reminderDays: data.reminder_days,
  };
}

export async function saveSettings(userId: string, settings: Settings): Promise<boolean> {
  const record = {
    user_id: userId,
    start_date: settings.startDate,
    notifications: settings.notifications,
    program_start_date: settings.programStartDate,
    last_pass_date: settings.lastPassDate,
    pass_history: settings.passHistory ?? [],
    pass_history_labels: settings.passHistoryLabels ?? [],
    reminder_time: settings.reminderTime,
    reminder_days: settings.reminderDays ?? [1, 2, 3, 4, 5, 6, 0],
  };

  const { error } = await getSupabase().from('settings').upsert(record, {
    onConflict: 'user_id',
    ignoreDuplicates: false,
  });

  if (error) {
    throw new Error(`Failed to save settings: ${error.message}`);
  }

  return true;
}
