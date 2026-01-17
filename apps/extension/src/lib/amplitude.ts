// Amplitude tracking for browser extension
// In production, import from @amplitude/analytics-browser

const AMPLITUDE_API_KEY = '';// Will be set from environment
const MOCK_MODE = true; // Set to false when API key is configured

interface AmplitudeEvent {
  eventType: string;
  eventProperties: Record<string, any>;
  timestamp: number;
}

class AmplitudeTracker {
  private userId: string = '';
  private eventQueue: AmplitudeEvent[] = [];

  /**
   * Initialize Amplitude with user ID
   */
  init(userId: string): void {
    this.userId = userId;
    
    if (!MOCK_MODE) {
      // In production:
      // amplitude.init(AMPLITUDE_API_KEY, userId);
    }

    console.log('[Sentinella] Amplitude initialized for user:', userId);
  }

  /**
   * Track an event
   */
  track(eventType: string, eventProperties: Record<string, any> = {}): void {
    const event: AmplitudeEvent = {
      eventType,
      eventProperties: {
        ...eventProperties,
        user_id: this.userId,
      },
      timestamp: Date.now(),
    };

    if (MOCK_MODE) {
      console.log('[Amplitude]', eventType, eventProperties);
      this.eventQueue.push(event);
      
      // Keep queue manageable
      if (this.eventQueue.length > 100) {
        this.eventQueue = this.eventQueue.slice(-50);
      }
    } else {
      // In production:
      // amplitude.track(eventType, eventProperties);
    }
  }

  /**
   * Track filter triggered
   */
  trackFilterTriggered(
    category: string,
    subcategory: string | undefined,
    confidence: number,
    platform: string
  ): void {
    this.track('filter_triggered', {
      user_type: 'viewer',
      filter_category: category,
      filter_subcategory: subcategory,
      confidence_score: confidence,
      stream_platform: platform,
    });
  }

  /**
   * Track filter override
   */
  trackFilterOverride(
    category: string,
    subcategory: string | undefined,
    overrideType: string,
    sessionCount: number
  ): void {
    this.track('filter_override', {
      user_type: 'viewer',
      filter_category: category,
      filter_subcategory: subcategory,
      override_type: overrideType,
      session_override_count: sessionCount,
    });
  }

  /**
   * Track sensitivity adjustment response
   */
  trackAdjustmentResponse(
    category: string,
    accepted: boolean,
    responseType: string
  ): void {
    this.track('sensitivity_adjustment_response', {
      user_type: 'viewer',
      filter_category: category,
      adjustment_accepted: accepted,
      response_type: responseType,
    });
  }

  /**
   * Track profile switch
   */
  trackProfileSwitch(fromProfile: string, toProfile: string): void {
    this.track('profile_switched', {
      user_type: 'viewer',
      from_profile: fromProfile,
      to_profile: toProfile,
      trigger: 'manual',
    });
  }

  /**
   * Track session start
   */
  trackSessionStart(platform: string, profile: string, enabledFilters: number): void {
    this.track('session_start', {
      user_type: 'viewer',
      platform,
      initial_profile: profile,
      filter_count_enabled: enabledFilters,
    });
  }

  /**
   * Track session end
   */
  trackSessionEnd(
    duration: number,
    totalFiltered: number,
    totalOverridden: number
  ): void {
    this.track('session_end', {
      user_type: 'viewer',
      session_duration: duration,
      total_filtered: totalFiltered,
      total_overridden: totalOverridden,
    });
  }

  /**
   * Get recent events (for debugging)
   */
  getRecentEvents(): AmplitudeEvent[] {
    return [...this.eventQueue];
  }
}

export const amplitude = new AmplitudeTracker();
