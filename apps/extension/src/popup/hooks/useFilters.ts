import { useState, useEffect, useCallback } from 'react';
import { getActiveProfile, updateFilter, saveProfiles, getProfiles } from '../../lib/storage';
import type { FilterConfig, FilterLevel, FilterCategory, UserProfile } from '../../types';

export function useFilters() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial profile
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const activeProfile = await getActiveProfile();
      setProfile(activeProfile);
      setError(null);
    } catch (e) {
      setError('Failed to load profile');
      console.error('Failed to load profile:', e);
    } finally {
      setLoading(false);
    }
  };

  // Update a single filter
  const setFilterLevel = useCallback(async (category: FilterCategory, level: FilterLevel) => {
    if (!profile) return;

    try {
      // Update local state immediately
      const updatedFilters = profile.filters.map(f =>
        f.category === category ? { ...f, level } : f
      );
      setProfile({ ...profile, filters: updatedFilters });

      // Persist to storage
      await updateFilter(category, { level });
    } catch (e) {
      console.error('Failed to update filter:', e);
      // Rollback on error
      loadProfile();
    }
  }, [profile]);

  // Update filter threshold
  const setFilterThreshold = useCallback(async (category: FilterCategory, threshold: number) => {
    if (!profile) return;

    try {
      const updatedFilters = profile.filters.map(f =>
        f.category === category ? { ...f, threshold } : f
      );
      setProfile({ ...profile, filters: updatedFilters });
      await updateFilter(category, { threshold });
    } catch (e) {
      console.error('Failed to update threshold:', e);
      loadProfile();
    }
  }, [profile]);

  // Apply a preset
  const applyPreset = useCallback(async (preset: Record<FilterCategory, FilterLevel>) => {
    if (!profile) return;

    try {
      const updatedFilters = profile.filters.map(f => ({
        ...f,
        level: preset[f.category] || f.level,
      }));

      const updatedProfile = { ...profile, filters: updatedFilters };
      setProfile(updatedProfile);

      // Save all profiles with updated active profile
      const profiles = await getProfiles();
      const updated = profiles.map(p =>
        p.id === profile.id ? updatedProfile : p
      );
      await saveProfiles(updated);
    } catch (e) {
      console.error('Failed to apply preset:', e);
      loadProfile();
    }
  }, [profile]);

  // Get filter by category
  const getFilter = useCallback((category: FilterCategory): FilterConfig | undefined => {
    return profile?.filters.find(f => f.category === category);
  }, [profile]);

  // Check if any filters are active
  const hasActiveFilters = profile?.filters.some(f => f.level !== 'off') ?? false;

  // Get count of active filters
  const activeFilterCount = profile?.filters.filter(f => f.level !== 'off').length ?? 0;

  return {
    profile,
    filters: profile?.filters ?? [],
    loading,
    error,
    setFilterLevel,
    setFilterThreshold,
    applyPreset,
    getFilter,
    hasActiveFilters,
    activeFilterCount,
    reload: loadProfile,
  };
}
