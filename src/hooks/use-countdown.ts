import { useEffect, useState } from 'react';

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isComplete: boolean;
};

function toParts(msRemaining: number): CountdownParts {
  const clamped = Math.max(0, msRemaining);
  const totalSeconds = Math.floor(clamped / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isComplete: clamped === 0,
  };
}

export function useCountdown(targetMs: number): CountdownParts {
  const [parts, setParts] = useState(() => toParts(targetMs - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      setParts(toParts(targetMs - Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetMs]);

  return parts;
}
