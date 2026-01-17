import type { FilterCategory, OverrideType, LearnedPreference } from '@sentinella/shared';
import { LEARNING_THRESHOLDS } from '@sentinella/shared';
import { trackSensitivityAdjusted } from './amplitude.js';
import { v4 as uuid } from 'uuid';

interface OverrideRecord {
  category: FilterCategory;
  subcategory?: string;
  overrideType: OverrideType;
  timestamp: number;
  sessionId: string;
}

interface UserLearningState {
  overrides: OverrideRecord[];
  learnedPreferences: LearnedPreference[];
  pendingAdjustments: Array<{
    category: FilterCategory;
    subcategory?: string;
    suggestedThreshold: number;
    confidence: number;
    expiresAt: number;
  }>;
}

class LearningEngine {
  private userStates: Map<string, UserLearningState> = new Map();

  /**
   * Get or create user learning state
   */
  private getState(userId: string): UserLearningState {
    if (!this.userStates.has(userId)) {
      this.userStates.set(userId, {
        overrides: [],
        learnedPreferences: [],
        pendingAdjustments: [],
      });
    }
    return this.userStates.get(userId)!;
  }

  /**
   * Record a filter override
   */
  async recordOverride(
    userId: string,
    category: FilterCategory,
    subcategory: string | undefined,
    overrideType: OverrideType
  ): Promise<void> {
    const state = this.getState(userId);
    
    state.overrides.push({
      category,
      subcategory,
      overrideType,
      timestamp: Date.now(),
      sessionId: this.getCurrentSessionId(userId),
    });

    // Clean up old overrides (keep last 7 days)
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    state.overrides = state.overrides.filter(o => o.timestamp > weekAgo);
  }

  /**
   * Check if we should suggest an adjustment based on override patterns
   */
  async checkForAdjustment(
    userId: string,
    category: FilterCategory,
    subcategory: string | undefined
  ): Promise<{
    shouldAdjust: boolean;
    suggestedThreshold: number;
    confidence: number;
    reason: string;
  } | null> {
    const state = this.getState(userId);

    // Get recent overrides for this category
    const recentOverrides = state.overrides.filter(o => 
      o.category === category &&
      (!subcategory || o.subcategory === subcategory) &&
      o.timestamp > Date.now() - 24 * 60 * 60 * 1000 // Last 24 hours
    );

    // Count by override type
    const revealOnceCount = recentOverrides.filter(o => o.overrideType === 'reveal_once').length;
    const revealAlwaysCount = recentOverrides.filter(o => o.overrideType === 'reveal_always').length;
    const totalCount = recentOverrides.length;

    // Check if we have enough data
    if (totalCount < LEARNING_THRESHOLDS.MIN_OVERRIDES_FOR_ADJUSTMENT) {
      return null;
    }

    // Calculate override rate
    const overrideRate = totalCount / Math.max(1, this.getFilterTriggerCount(userId, category));

    if (overrideRate < LEARNING_THRESHOLDS.MIN_OVERRIDE_RATE) {
      return null;
    }

    // Calculate suggested new threshold
    const currentLearned = state.learnedPreferences.find(
      lp => lp.filterCategory === category && lp.filterSubcategory === subcategory
    );
    const currentThreshold = currentLearned?.learnedThreshold || 0.5;
    
    // Increase threshold (less filtering) based on override pattern
    const adjustment = LEARNING_THRESHOLDS.ADJUSTMENT_STEP * (revealAlwaysCount > 0 ? 1.5 : 1);
    const suggestedThreshold = Math.min(
      0.95,
      currentThreshold + adjustment
    );

    // Calculate confidence
    const confidence = Math.min(
      0.95,
      0.5 + (totalCount / 10) * 0.3 + (overrideRate * 0.2)
    );

    // Store pending adjustment
    state.pendingAdjustments.push({
      category,
      subcategory,
      suggestedThreshold,
      confidence,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes to respond
    });

    return {
      shouldAdjust: true,
      suggestedThreshold,
      confidence,
      reason: `You've overridden ${category}${subcategory ? ` (${subcategory})` : ''} ${totalCount} times recently`,
    };
  }

  /**
   * Process user's response to an adjustment suggestion
   */
  async processAdjustmentResponse(
    userId: string,
    category: FilterCategory,
    subcategory: string | undefined,
    accepted: boolean
  ): Promise<void> {
    const state = this.getState(userId);

    // Find the pending adjustment
    const adjustmentIndex = state.pendingAdjustments.findIndex(
      a => a.category === category && a.subcategory === subcategory
    );

    if (adjustmentIndex === -1) {
      return;
    }

    const adjustment = state.pendingAdjustments[adjustmentIndex];
    state.pendingAdjustments.splice(adjustmentIndex, 1);

    if (accepted) {
      // Apply the adjustment
      const existingIndex = state.learnedPreferences.findIndex(
        lp => lp.filterCategory === category && lp.filterSubcategory === subcategory
      );

      const oldThreshold = existingIndex >= 0 
        ? state.learnedPreferences[existingIndex].learnedThreshold 
        : 0.5;

      const learnedPref: LearnedPreference = {
        id: existingIndex >= 0 ? state.learnedPreferences[existingIndex].id : uuid(),
        userId,
        filterCategory: category,
        filterSubcategory: subcategory,
        originalThreshold: existingIndex >= 0 
          ? state.learnedPreferences[existingIndex].originalThreshold 
          : 0.5,
        learnedThreshold: adjustment.suggestedThreshold,
        confidence: adjustment.confidence,
        overrideCount: state.overrides.filter(
          o => o.category === category && o.subcategory === subcategory
        ).length,
        lastUpdated: new Date(),
      };

      if (existingIndex >= 0) {
        state.learnedPreferences[existingIndex] = learnedPref;
      } else {
        state.learnedPreferences.push(learnedPref);
      }

      // Track in Amplitude
      await trackSensitivityAdjusted(
        userId,
        category,
        subcategory,
        oldThreshold,
        adjustment.suggestedThreshold,
        learnedPref.overrideCount,
        adjustment.confidence
      );
    }
  }

  /**
   * Get all learned preferences for a user
   */
  async getLearnedPreferences(userId: string): Promise<LearnedPreference[]> {
    const state = this.getState(userId);
    return state.learnedPreferences;
  }

  /**
   * Get learning status for display in UI
   */
  async getLearningStatus(userId: string): Promise<Array<{
    category: FilterCategory;
    subcategory?: string;
    status: 'learning' | 'adjusted' | 'stable';
    confidence: number;
    description: string;
  }>> {
    const state = this.getState(userId);
    const status: Array<{
      category: FilterCategory;
      subcategory?: string;
      status: 'learning' | 'adjusted' | 'stable';
      confidence: number;
      description: string;
    }> = [];

    // Add learned preferences
    for (const pref of state.learnedPreferences) {
      const change = pref.learnedThreshold > pref.originalThreshold ? 'Reduced' : 'Increased';
      status.push({
        category: pref.filterCategory,
        subcategory: pref.filterSubcategory,
        status: 'adjusted',
        confidence: pref.confidence,
        description: `${change} filtering (${Math.round(pref.confidence * 100)}% confident)`,
      });
    }

    // Check for categories being learned
    const categoryOverrides = new Map<string, number>();
    for (const override of state.overrides) {
      const key = `${override.category}:${override.subcategory || ''}`;
      categoryOverrides.set(key, (categoryOverrides.get(key) || 0) + 1);
    }

    for (const [key, count] of categoryOverrides) {
      const [category, subcategory] = key.split(':');
      
      // Skip if already in learned preferences
      if (state.learnedPreferences.some(
        lp => lp.filterCategory === category && lp.filterSubcategory === (subcategory || undefined)
      )) {
        continue;
      }

      if (count >= 2) {
        status.push({
          category: category as FilterCategory,
          subcategory: subcategory || undefined,
          status: 'learning',
          confidence: count / LEARNING_THRESHOLDS.MIN_OVERRIDES_FOR_ADJUSTMENT,
          description: `Learning from ${count} overrides...`,
        });
      }
    }

    return status;
  }

  /**
   * Reset learned preferences for a category
   */
  async resetLearning(
    userId: string,
    category?: FilterCategory,
    subcategory?: string
  ): Promise<void> {
    const state = this.getState(userId);

    if (category) {
      state.learnedPreferences = state.learnedPreferences.filter(
        lp => !(lp.filterCategory === category && 
               (!subcategory || lp.filterSubcategory === subcategory))
      );
      state.overrides = state.overrides.filter(
        o => !(o.category === category && 
               (!subcategory || o.subcategory === subcategory))
      );
    } else {
      state.learnedPreferences = [];
      state.overrides = [];
    }
  }

  // ==================== HELPER METHODS ====================

  private getCurrentSessionId(userId: string): string {
    // In a real implementation, this would track actual sessions
    return `session-${userId}-${Math.floor(Date.now() / (30 * 60 * 1000))}`; // 30 min sessions
  }

  private getFilterTriggerCount(userId: string, category: FilterCategory): number {
    // In a real implementation, this would track actual filter triggers
    // For now, estimate based on overrides
    const state = this.getState(userId);
    const overrideCount = state.overrides.filter(o => o.category === category).length;
    return Math.max(10, overrideCount * 2); // Assume ~50% override rate
  }
}

export const learningEngine = new LearningEngine();

