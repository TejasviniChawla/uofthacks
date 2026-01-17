import type { FilterConfig, UserProfile, SessionStats, LearnedPreference } from '../types';
import { DEFAULT_FILTER_CONFIGS } from './constants';
import { v4 as uuid } from './uuid';

const STORAGE_KEYS = {
  USER_ID: 'sentinella_user_id',
  PROFILES: 'sentinella_profiles',
  ACTIVE_PROFILE: 'sentinella_active_profile',
  SESSION_STATS: 'sentinella_session_stats',
  LEARNED_PREFS: 'sentinella_learned_prefs',
} as const;

/**
 * Get or create a unique user ID
 */
export async function getUserId(): Promise<string> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.USER_ID);
  
  if (result[STORAGE_KEYS.USER_ID]) {
    return result[STORAGE_KEYS.USER_ID];
  }

  const newId = uuid();
  await chrome.storage.local.set({ [STORAGE_KEYS.USER_ID]: newId });
  return newId;
}

/**
 * Get all user profiles
 */
export async function getProfiles(): Promise<UserProfile[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.PROFILES);
  
  if (result[STORAGE_KEYS.PROFILES]?.length > 0) {
    return result[STORAGE_KEYS.PROFILES];
  }

  // Create default profile
  const defaultProfile: UserProfile = {
    id: uuid(),
    name: 'Default',
    isDefault: true,
    isLocked: false,
    filters: [...DEFAULT_FILTER_CONFIGS],
  };

  await chrome.storage.local.set({ 
    [STORAGE_KEYS.PROFILES]: [defaultProfile],
    [STORAGE_KEYS.ACTIVE_PROFILE]: defaultProfile.id,
  });

  return [defaultProfile];
}

/**
 * Get the active profile
 */
export async function getActiveProfile(): Promise<UserProfile> {
  const [profiles, result] = await Promise.all([
    getProfiles(),
    chrome.storage.local.get(STORAGE_KEYS.ACTIVE_PROFILE),
  ]);

  const activeId = result[STORAGE_KEYS.ACTIVE_PROFILE];
  const active = profiles.find(p => p.id === activeId);
  
  return active || profiles[0];
}

/**
 * Set the active profile
 */
export async function setActiveProfile(profileId: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.ACTIVE_PROFILE]: profileId });
}

/**
 * Save profiles
 */
export async function saveProfiles(profiles: UserProfile[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.PROFILES]: profiles });
}

/**
 * Update a specific filter in the active profile
 */
export async function updateFilter(
  category: string,
  updates: Partial<FilterConfig>
): Promise<void> {
  const profiles = await getProfiles();
  const activeProfile = await getActiveProfile();

  const profileIndex = profiles.findIndex(p => p.id === activeProfile.id);
  if (profileIndex === -1) return;

  const filterIndex = profiles[profileIndex].filters.findIndex(
    f => f.category === category
  );
  if (filterIndex === -1) return;

  profiles[profileIndex].filters[filterIndex] = {
    ...profiles[profileIndex].filters[filterIndex],
    ...updates,
  };

  await saveProfiles(profiles);
}

/**
 * Get session stats
 */
export async function getSessionStats(): Promise<SessionStats> {
  const result = await chrome.storage.session.get(STORAGE_KEYS.SESSION_STATS);
  
  if (result[STORAGE_KEYS.SESSION_STATS]) {
    return result[STORAGE_KEYS.SESSION_STATS];
  }

  const defaultStats: SessionStats = {
    totalFiltered: 0,
    filteredByCategory: {
      profanity: 0,
      violence: 0,
      sexual: 0,
      jumpscares: 0,
      flashing: 0,
      spoilers: 0,
      loud_audio: 0,
      hate_speech: 0,
    },
    totalRevealed: 0,
    sessionStartTime: Date.now(),
    aiAdjustments: 0,
  };

  await chrome.storage.session.set({ [STORAGE_KEYS.SESSION_STATS]: defaultStats });
  return defaultStats;
}

/**
 * Update session stats
 */
export async function updateSessionStats(
  updates: Partial<SessionStats>
): Promise<void> {
  const current = await getSessionStats();
  await chrome.storage.session.set({
    [STORAGE_KEYS.SESSION_STATS]: { ...current, ...updates },
  });
}

/**
 * Increment filtered count
 */
export async function incrementFiltered(category: string): Promise<void> {
  const stats = await getSessionStats();
  stats.totalFiltered++;
  if (category in stats.filteredByCategory) {
    stats.filteredByCategory[category as keyof typeof stats.filteredByCategory]++;
  }
  await chrome.storage.session.set({ [STORAGE_KEYS.SESSION_STATS]: stats });
}

/**
 * Increment revealed count
 */
export async function incrementRevealed(): Promise<void> {
  const stats = await getSessionStats();
  stats.totalRevealed++;
  await chrome.storage.session.set({ [STORAGE_KEYS.SESSION_STATS]: stats });
}

/**
 * Get learned preferences
 */
export async function getLearnedPreferences(): Promise<LearnedPreference[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.LEARNED_PREFS);
  return result[STORAGE_KEYS.LEARNED_PREFS] || [];
}

/**
 * Save learned preferences
 */
export async function saveLearnedPreferences(
  prefs: LearnedPreference[]
): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.LEARNED_PREFS]: prefs });
}
