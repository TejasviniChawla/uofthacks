import { trackUserOverride, trackSensitivityShift } from '../analytics/amplitude.js';

export class AdaptiveLearner {
  constructor(analyticsClient) {
    this.analyticsClient = analyticsClient;
    this.overrideHistory = new Map(); // streamId -> Map<category, count>
    this.sensitivitySettings = new Map(); // streamId -> sensitivity settings
    this.overrideThreshold = parseInt(process.env.LEARNING_OVERRIDE_THRESHOLD || '3');
  }

  /**
   * Handle user override (when viewer clicks "unblur" or "undo bleep")
   */
  async handleOverride(streamId, moderationId, originalType, action = 'override') {
    const startTime = Date.now();
    
    // Track the override event
    trackUserOverride(this.analyticsClient, {
      originalType,
      latencyMs: 0, // Will be calculated below
      streamId,
      moderationId,
      timestamp: Date.now()
    });

    // Get category from original type
    const category = this.getCategoryFromType(originalType);
    
    // Track override history
    if (!this.overrideHistory.has(streamId)) {
      this.overrideHistory.set(streamId, new Map());
    }
    
    const history = this.overrideHistory.get(streamId);
    const currentCount = history.get(category) || 0;
    history.set(category, currentCount + 1);

    // Check if we've reached the threshold for this category
    if (currentCount + 1 >= this.overrideThreshold) {
      await this.adjustSensitivity(streamId, category, 'decrease');
    }

    const latencyMs = Date.now() - startTime;
    
    return {
      success: true,
      category,
      overrideCount: currentCount + 1,
      sensitivityAdjusted: currentCount + 1 >= this.overrideThreshold,
      latencyMs
    };
  }

  /**
   * Adjust sensitivity based on override patterns
   */
  async adjustSensitivity(streamId, category, direction) {
    const currentSettings = this.getSensitivitySettings(streamId);
    const oldThreshold = currentSettings[category]?.threshold || this.getDefaultThreshold(category);
    
    let newThreshold;
    if (direction === 'decrease') {
      // Decrease sensitivity = increase threshold (less aggressive)
      newThreshold = Math.min(1.0, oldThreshold + 0.1);
    } else {
      // Increase sensitivity = decrease threshold (more aggressive)
      newThreshold = Math.max(0.1, oldThreshold - 0.1);
    }

    // Update settings
    if (!this.sensitivitySettings.has(streamId)) {
      this.sensitivitySettings.set(streamId, {});
    }
    
    const settings = this.sensitivitySettings.get(streamId);
    settings[category] = {
      threshold: newThreshold,
      lastUpdated: Date.now(),
      reason: `User overrides (${direction} sensitivity)`
    };

    // Track sensitivity shift
    trackSensitivityShift(this.analyticsClient, {
      oldThreshold,
      newThreshold,
      moderationType: category,
      streamId,
      reason: `Adaptive learning: ${direction} sensitivity based on ${this.overrideThreshold} overrides`,
      timestamp: Date.now()
    });

    return {
      category,
      oldThreshold,
      newThreshold,
      direction,
      notification: `AI Sensitivity ${direction === 'decrease' ? 'decreased' : 'increased'} for '${category}' based on your recent overrides.`
    };
  }

  /**
   * Get current sensitivity settings for a stream
   */
  getSensitivitySettings(streamId) {
    if (!this.sensitivitySettings.has(streamId)) {
      // Initialize with defaults
      this.sensitivitySettings.set(streamId, {
        visual_pii: { threshold: parseFloat(process.env.DEFAULT_BLUR_CONFIDENCE || '0.7') },
        audio_violation: { threshold: parseFloat(process.env.DEFAULT_BLEEP_CONFIDENCE || '0.8') }
      });
    }
    return this.sensitivitySettings.get(streamId);
  }

  /**
   * Get default threshold for a category
   */
  getDefaultThreshold(category) {
    if (category === 'visual_pii' || category === 'blur') {
      return parseFloat(process.env.DEFAULT_BLUR_CONFIDENCE || '0.7');
    }
    if (category === 'audio_violation' || category === 'bleep') {
      return parseFloat(process.env.DEFAULT_BLEEP_CONFIDENCE || '0.8');
    }
    return 0.75;
  }

  /**
   * Extract category from moderation type
   */
  getCategoryFromType(type) {
    if (type === 'blur') return 'visual_pii';
    if (type === 'bleep') return 'audio_violation';
    return type;
  }

  /**
   * Get override history for a stream
   */
  getOverrideHistory(streamId) {
    return this.overrideHistory.get(streamId) || new Map();
  }

  /**
   * Clear learning data for a stream
   */
  clearStream(streamId) {
    this.overrideHistory.delete(streamId);
    this.sensitivitySettings.delete(streamId);
  }
}
