import { useState, useEffect } from 'react';
import { initNycTime, getNycTimestamp, getLocalTimestamp } from '../services/nycTime';

interface NycClockState {
  ready: boolean;
  localTime: string;
  nycTime: string;
}

export default function useNycClock(): NycClockState {
  const [ready, setReady] = useState(false);
  const [localTime, setLocalTime] = useState('');
  const [nycTime, setNycTime] = useState('');

  useEffect(() => {
    initNycTime().then(setReady).catch(() => setReady(false));
  }, []);

  useEffect(() => {
    let rafId: number;
    let lastTick = 0;
    const tick = (now: number) => {
      if (now - lastTick >= 1000) {
        setLocalTime(getLocalTimestamp());
        setNycTime(getNycTimestamp());
        lastTick = now;
      }
      rafId = requestAnimationFrame(tick);
    };
    tick(performance.now());
    const onVisibility = () => { if (!document.hidden) tick(performance.now()); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      if (typeof rafId !== 'undefined') cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return { ready, localTime, nycTime };
}
