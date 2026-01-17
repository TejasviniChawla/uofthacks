import { useState, useEffect } from 'react';
import type { SessionStats } from '@shared/types';

export function useSessionStats() {
  const [stats, setStats] = useState<SessionStats>({
    itemsFiltered: 0,
    itemsByCategory: {},
    itemsRevealed: 0,
    overrides: 0,
    sessionStart: Date.now()
  });

  const refreshStats = () => {
    chrome.storage.local.get(['sessionStats'], (result) => {
      if (result.sessionStats) {
        setStats(result.sessionStats);
      }
    });
  };

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 2000);
    return () => clearInterval(interval);
  }, []);

  return { stats, refreshStats };
}
