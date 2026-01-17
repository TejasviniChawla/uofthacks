import type { 
  Detection, 
  FilterInstruction, 
  FilterConfig,
  FilterCategory,
  VisualFilterType,
  AudioFilterType
} from '@sentinella/shared';
import { 
  FILTER_LEVEL_THRESHOLDS, 
  VISUAL_FILTER_INTENSITIES,
  DEFAULT_FILTER_CONFIGS
} from '@sentinella/shared';
import { userPreferencesStore } from '../db/preferences-store.js';
import { learningEngine } from './learning-engine.js';
import { v4 as uuid } from 'uuid';

class FilterEngine {
  /**
   * Generate filter instructions based on detections and user preferences
   */
  async generateInstructions(
    userId: string,
    detections: Detection[],
    timestamp: number
  ): Promise<FilterInstruction[]> {
    const instructions: FilterInstruction[] = [];

    // Get user's active filter config
    const preferences = await userPreferencesStore.getActiveProfile(userId);
    const filterConfigs = preferences?.filters || DEFAULT_FILTER_CONFIGS;

    // Get learned adjustments
    const learnedPrefs = await learningEngine.getLearnedPreferences(userId);

    for (const detection of detections) {
      // Find matching filter config
      const filterConfig = filterConfigs.find(
        f => f.category === detection.type
      );

      if (!filterConfig || filterConfig.level === 'off') {
        continue;
      }

      // Get effective threshold (considering learned preferences)
      const effectiveThreshold = this.getEffectiveThreshold(
        filterConfig,
        detection,
        learnedPrefs
      );

      // Check if detection exceeds threshold
      if (detection.confidence >= effectiveThreshold) {
        const instruction = this.createInstruction(
          detection,
          filterConfig,
          timestamp
        );
        instructions.push(instruction);
      }
    }

    return instructions;
  }

  /**
   * Get effective threshold considering learned preferences
   */
  private getEffectiveThreshold(
    config: FilterConfig,
    detection: Detection,
    learnedPrefs: Array<{ filterCategory: string; filterSubcategory?: string; learnedThreshold: number }>
  ): number {
    // Start with config threshold
    let threshold = config.threshold;

    // Check for learned preference
    const learned = learnedPrefs.find(lp => 
      lp.filterCategory === detection.type &&
      (!detection.subtype || lp.filterSubcategory === detection.subtype)
    );

    if (learned) {
      threshold = learned.learnedThreshold;
    }

    // Check subcategory threshold
    if (detection.subtype && config.subcategories?.[detection.subtype]) {
      const subConfig = config.subcategories[detection.subtype];
      if (subConfig.enabled) {
        threshold = Math.min(threshold, subConfig.threshold);
      }
    }

    return threshold;
  }

  /**
   * Create a filter instruction from a detection
   */
  private createInstruction(
    detection: Detection,
    config: FilterConfig,
    baseTimestamp: number
  ): FilterInstruction {
    const isAudioDetection = detection.model === 'pegasus';
    
    return {
      detectionId: detection.id,
      filterType: isAudioDetection ? config.audioFilter : config.visualFilter,
      startTime: detection.timestamp,
      endTime: detection.timestamp + (detection.duration || 1000),
      bbox: detection.bbox,
      intensity: this.getIntensity(config),
    };
  }

  /**
   * Get filter intensity based on level
   */
  private getIntensity(config: FilterConfig): number {
    const levelIndex = ['off', 'low', 'medium', 'high', 'maximum'].indexOf(config.level);
    return levelIndex / 4; // 0 to 1
  }

  /**
   * Apply emotional state adjustments to filter thresholds
   */
  adjustForEmotionalState(
    configs: FilterConfig[],
    tensionLevel: number,
    profanityRisk: 'low' | 'medium' | 'high'
  ): FilterConfig[] {
    if (tensionLevel < 0.5 && profanityRisk === 'low') {
      return configs;
    }

    return configs.map(config => {
      if (config.category === 'profanity' || config.category === 'hate_speech') {
        // Lower threshold (more aggressive) when tension is high
        const adjustment = 1 + (tensionLevel * 0.3);
        return {
          ...config,
          threshold: Math.max(0.2, config.threshold / adjustment),
        };
      }
      return config;
    });
  }

  /**
   * Check if a category should be filtered based on config
   */
  shouldFilter(
    category: FilterCategory,
    subcategory: string | undefined,
    confidence: number,
    configs: FilterConfig[]
  ): boolean {
    const config = configs.find(c => c.category === category);
    if (!config || config.level === 'off') {
      return false;
    }

    let threshold = config.threshold;

    if (subcategory && config.subcategories?.[subcategory]) {
      const subConfig = config.subcategories[subcategory];
      if (!subConfig.enabled) {
        return false;
      }
      threshold = subConfig.threshold;
    }

    return confidence >= threshold;
  }

  /**
   * Get filter preview for UI
   */
  getFilterPreview(level: string, filterType: VisualFilterType): {
    description: string;
    intensity: number;
  } {
    const intensities = VISUAL_FILTER_INTENSITIES[filterType];
    const intensity = intensities[level as keyof typeof intensities] || 0;

    const descriptions: Record<string, string> = {
      blur: `Gaussian blur with radius ${intensity}px`,
      black_box: `Black overlay at ${Math.round(intensity * 100)}% opacity`,
      pixelate: `Pixelate with ${intensity}px blocks`,
      dim: `Brightness reduced to ${Math.round((1 - intensity) * 100)}%`,
    };

    return {
      description: descriptions[filterType] || 'Unknown filter',
      intensity,
    };
  }
}

export const filterEngine = new FilterEngine();

