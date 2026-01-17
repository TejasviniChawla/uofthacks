import type { FilterConfig, UserPreferences } from '@sentinella/shared';
import { DEFAULT_FILTER_CONFIGS } from '@sentinella/shared';
import { v4 as uuid } from 'uuid';

// In-memory store for hackathon demo
// In production, this would use PostgreSQL

interface StoredProfile {
  id: string;
  userId: string;
  profileName: string;
  isDefault: boolean;
  isLocked: boolean;
  lockPinHash?: string;
  filters: FilterConfig[];
  createdAt: Date;
  updatedAt: Date;
}

interface UserState {
  profiles: StoredProfile[];
  activeProfileId: string;
}

class UserPreferencesStore {
  private users: Map<string, UserState> = new Map();

  /**
   * Get or create user state
   */
  private getOrCreateUser(userId: string): UserState {
    if (!this.users.has(userId)) {
      // Create default profile for new user
      const defaultProfile: StoredProfile = {
        id: uuid(),
        userId,
        profileName: 'Default',
        isDefault: true,
        isLocked: false,
        filters: [...DEFAULT_FILTER_CONFIGS],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.users.set(userId, {
        profiles: [defaultProfile],
        activeProfileId: defaultProfile.id,
      });
    }
    return this.users.get(userId)!;
  }

  /**
   * Get all profiles for a user
   */
  async getPreferences(userId: string): Promise<StoredProfile[]> {
    const user = this.getOrCreateUser(userId);
    return user.profiles;
  }

  /**
   * Get a specific profile
   */
  async getProfile(userId: string, profileId: string): Promise<StoredProfile | null> {
    const user = this.getOrCreateUser(userId);
    return user.profiles.find(p => p.id === profileId) || null;
  }

  /**
   * Get the active profile
   */
  async getActiveProfile(userId: string): Promise<StoredProfile | null> {
    const user = this.getOrCreateUser(userId);
    return user.profiles.find(p => p.id === user.activeProfileId) || null;
  }

  /**
   * Create a new profile
   */
  async createProfile(
    userId: string,
    data: {
      profileName: string;
      isDefault?: boolean;
      isLocked?: boolean;
      lockPin?: string;
      filters: FilterConfig[];
    }
  ): Promise<StoredProfile> {
    const user = this.getOrCreateUser(userId);

    // If this is set as default, unset other defaults
    if (data.isDefault) {
      for (const profile of user.profiles) {
        profile.isDefault = false;
      }
    }

    const newProfile: StoredProfile = {
      id: uuid(),
      userId,
      profileName: data.profileName,
      isDefault: data.isDefault || false,
      isLocked: data.isLocked || false,
      lockPinHash: data.lockPin ? this.hashPin(data.lockPin) : undefined,
      filters: data.filters,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    user.profiles.push(newProfile);
    return newProfile;
  }

  /**
   * Update a profile
   */
  async updateProfile(
    userId: string,
    profileId: string,
    data: Partial<{
      profileName: string;
      isDefault: boolean;
      isLocked: boolean;
      lockPin: string;
      filters: FilterConfig[];
    }>
  ): Promise<StoredProfile | null> {
    const user = this.getOrCreateUser(userId);
    const profile = user.profiles.find(p => p.id === profileId);

    if (!profile) {
      return null;
    }

    // If this is set as default, unset other defaults
    if (data.isDefault) {
      for (const p of user.profiles) {
        p.isDefault = false;
      }
    }

    if (data.profileName !== undefined) profile.profileName = data.profileName;
    if (data.isDefault !== undefined) profile.isDefault = data.isDefault;
    if (data.isLocked !== undefined) profile.isLocked = data.isLocked;
    if (data.lockPin !== undefined) profile.lockPinHash = this.hashPin(data.lockPin);
    if (data.filters !== undefined) profile.filters = data.filters;
    profile.updatedAt = new Date();

    return profile;
  }

  /**
   * Delete a profile
   */
  async deleteProfile(userId: string, profileId: string): Promise<boolean> {
    const user = this.getOrCreateUser(userId);
    const index = user.profiles.findIndex(p => p.id === profileId);

    if (index === -1) {
      return false;
    }

    // Don't delete the last profile
    if (user.profiles.length === 1) {
      throw new Error('Cannot delete the last profile');
    }

    const wasActive = user.activeProfileId === profileId;
    const wasDefault = user.profiles[index].isDefault;

    user.profiles.splice(index, 1);

    // If we deleted the active profile, switch to default or first
    if (wasActive) {
      const defaultProfile = user.profiles.find(p => p.isDefault);
      user.activeProfileId = defaultProfile?.id || user.profiles[0].id;
    }

    // If we deleted the default, make the first profile default
    if (wasDefault && user.profiles.length > 0) {
      user.profiles[0].isDefault = true;
    }

    return true;
  }

  /**
   * Set the active profile
   */
  async setActiveProfile(userId: string, profileId: string): Promise<boolean> {
    const user = this.getOrCreateUser(userId);
    const profile = user.profiles.find(p => p.id === profileId);

    if (!profile) {
      return false;
    }

    user.activeProfileId = profileId;
    return true;
  }

  /**
   * Update a specific filter in the active profile
   */
  async updateFilter(
    userId: string,
    category: string,
    updates: Partial<FilterConfig>
  ): Promise<FilterConfig | null> {
    const user = this.getOrCreateUser(userId);
    const profile = user.profiles.find(p => p.id === user.activeProfileId);

    if (!profile) {
      return null;
    }

    const filterIndex = profile.filters.findIndex(f => f.category === category);
    if (filterIndex === -1) {
      return null;
    }

    profile.filters[filterIndex] = {
      ...profile.filters[filterIndex],
      ...updates,
    };
    profile.updatedAt = new Date();

    return profile.filters[filterIndex];
  }

  /**
   * Verify PIN for locked profile
   */
  async verifyPin(userId: string, profileId: string, pin: string): Promise<boolean> {
    const profile = await this.getProfile(userId, profileId);
    if (!profile || !profile.lockPinHash) {
      return false;
    }
    return this.hashPin(pin) === profile.lockPinHash;
  }

  /**
   * Simple hash function for PINs (demo only - use bcrypt in production)
   */
  private hashPin(pin: string): string {
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
      const char = pin.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

export const userPreferencesStore = new UserPreferencesStore();

