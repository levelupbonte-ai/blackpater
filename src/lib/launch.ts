import { useEffect, useState } from 'react';
import { LAUNCH_ENDS_MS } from '../../shared/offers.js';

/**
 * Current time, ticking every second while the launch offer runs (and once
 * when it ends, so prices switch to the regular ones without a reload).
 */
export function useLaunchClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (Date.now() >= LAUNCH_ENDS_MS) return;
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= LAUNCH_ENDS_MS) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

/** Days, hours, minutes and seconds left (all 0 once ended). */
export function timeLeft(now: number) {
  const ms = Math.max(0, LAUNCH_ENDS_MS - now);
  const s = Math.floor(ms / 1000);
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60, done: ms === 0 };
}
