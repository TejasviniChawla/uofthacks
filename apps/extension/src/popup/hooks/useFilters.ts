import { useState, useEffect } from 'react';
import type { UserPreferences, FilterCategory, FilterLevel } from '@shared/types';
import { DEFAULT_FILTER_THRESHOLDS } from '@shared/constants';

export function useFilters() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  const loadPreferences = async () => {
    return new Promise<void>((resolve) => {
      chrome.storage.local.get(['preferences'], (result) => {
        if (result.preferences) {
          setPreferences(result.preferences);
        } else {
          // Set defaults
          const defaultPrefs: UserPreferences = {
            userId: `user_${Date.now()}`,
            profileName: 'Default',
            isDefault: true,
            isLocked: false,
            filters: {
              profanity: { category: 'profanity', level: 'MEDIUM', enabled: true, threshold: DEFAULT_FILTER_THRESHOLDS.MEDIUM, action: 'bleep' },
              violence: { category: 'violence', level: 'LOW', enabled: true, threshold: DEFAULT_FILTER_THRESHOLDS.LOW, action: 'blur' },
              sexual: { category: 'sexual', level: 'HIGH', enabled: true, threshold: DEFAULT_FILTER_THRESHOLDS.HIGH, action: 'blur' },
              jumpscares: { category: 'jumpscares', level: 'HIGH', enabled: true, threshold: DEFAULT_FILTER_THRESHOLDS.HIGH, action: 'dim' },
              flashing: { category: 'flashing', level: 'HIGH', enabled: true, threshold: DEFAULT_FILTER_THRESHOLDS.HIGH, action: 'dim' },
              spoilers: { category: 'spoilers', level: 'OFF', enabled: false, threshold: DEFAULT_FILTER_THRESHOLDS.OFF, action: 'blur' },
              loud_audio: { category: 'loud_audio', level: 'MEDIUM', enabled: true, threshold: DEFAULT_FILTER_THRESHOLDS.MEDIUM, action: 'normalize' },
              hate_speech: { category: 'hate_speech', level: 'HIGH', enabled: true, threshold: DEFAULT_FILTER_THRESHOLDS.HIGH, action: 'mute' }
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setPreferences(defaultPrefs);
          chrome.storage.local.set({ preferences: defaultPrefs });
        }
        resolve();
      });
    });
  };

  const updateFilter = (category: FilterCategory, level: FilterLevel) => {
    if (!preferences) return;

    const updated = {
      ...preferences,
      filters: {
        ...preferences.filters,
        [category]: {
          ...preferences.filters[category],
          level,
          enabled: level !== 'OFF',
          threshold: DEFAULT_FILTER_THRESHOLDS[level]
        }
      },
      updatedAt: new Date().toISOString()
    };

    setPreferences(updated);
    chrome.storage.local.set({ preferences: updated });

    // Notify content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'PREFERENCES_UPDATED',
          preferences: updated
        });
      }
    });
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  return { preferences, updateFilter, loadPreferences };
}
