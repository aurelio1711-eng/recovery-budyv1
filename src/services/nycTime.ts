import { fetchNycTime } from './api';

let clockDrift = 0;
let initialized = false;

export const initNycTime = async (): Promise<boolean> => {
  try {
    const data = await fetchNycTime();
    const apiUtcEpoch = new Date(data.utc_datetime.replace(' ', 'T') + 'Z').getTime();
    clockDrift = apiUtcEpoch - Date.now();
    initialized = true;
    return true;
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('API key not configured')) {
    console.warn('NYC time: API key not set, using local clock');
  } else {
    console.error('Failed to init NYC time, falling back to local clock:', e);
  }
    initialized = false;
    return false;
  }
};

const adjustedEpoch = (): number => Date.now() + clockDrift;

export const getToday = (): string => {
  const epoch = adjustedEpoch();
  return new Date(epoch).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
};

export const getNycTimestamp = (): string => {
  const epoch = adjustedEpoch();
  const d = new Date(epoch);
  const opts = { timeZone: 'America/New_York', hour12: false as const };
  const time = d.toLocaleTimeString('en-US', opts);
  return `${getToday()} ${time}`;
};

export const getLocalTimestamp = (): string => {
  const now = new Date();
  const date = now.toLocaleDateString('en-CA');
  const time = now.toLocaleTimeString('en-US', { hour12: false as const });
  return `${date} ${time}`;
};
