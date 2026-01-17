// Amplitude analytics integration for extension

import { init, track } from '@amplitude/analytics-browser';

let isInitialized = false;

export async function initializeAmplitude(): Promise<any> {
  const apiKey = import.meta.env.VITE_AMPLITUDE_API_KEY;
  
  if (!apiKey || apiKey === 'your_amplitude_api_key_here') {
    console.warn('⚠️ Amplitude API key not configured');
    return null;
  }

  try {
    init(apiKey, {
      defaultTracking: {
        sessions: true,
        pageViews: false,
        formInteractions: false,
        fileDownloads: false
      }
    });
    isInitialized = true;
    console.log('✅ Amplitude initialized in extension');
    return { initialized: true };
  } catch (error) {
    console.error('❌ Failed to initialize Amplitude:', error);
    return null;
  }
}

export function trackEvent(eventName: string, properties: Record<string, any>, userId?: string) {
  if (!isInitialized) return;

  try {
    track(eventName, properties, { userId });
  } catch (error) {
    console.error(`Error tracking event ${eventName}:`, error);
  }
}

// Specific event tracking functions
export function trackFilterTriggered(properties: {
  filterCategory: string;
  filterSubcategory?: string;
  confidenceScore: number;
  detectionModel: string;
  streamPlatform: string;
  streamerId?: string;
  timeInStream: number;
  bufferTimeRemaining: number;
}) {
  trackEvent('filter_triggered', {
    user_type: 'viewer',
    ...properties
  });
}

export function trackFilterOverride(properties: {
  filterCategory: string;
  filterSubcategory?: string;
  confidenceScore: number;
  overrideType: 'reveal_once' | 'reveal_always' | 'reveal_hold';
  timeToOverride: number;
  sessionOverrideCount: number;
  totalOverrideCount: number;
}) {
  trackEvent('filter_override', {
    user_type: 'viewer',
    ...properties
  });
}

export function trackSensitivityAutoAdjusted(properties: {
  filterCategory: string;
  filterSubcategory?: string;
  oldThreshold: number;
  newThreshold: number;
  triggerReason: string;
  overrideCountTrigger: number;
  confidenceInAdjustment: number;
}) {
  trackEvent('sensitivity_auto_adjusted', {
    user_type: 'viewer',
    ...properties
  });
}

export function trackSensitivityAdjustmentResponse(properties: {
  filterCategory: string;
  adjustmentAccepted: boolean;
  timeToRespond?: number;
  responseType: 'explicit_accept' | 'explicit_reject' | 'implicit_accept';
}) {
  trackEvent('sensitivity_adjustment_response', {
    user_type: 'viewer',
    ...properties
  });
}

export function trackProfileSwitched(properties: {
  fromProfile: string;
  toProfile: string;
  trigger: 'manual' | 'scheduled' | 'context';
}) {
  trackEvent('profile_switched', {
    user_type: 'viewer',
    ...properties
  });
}

export { isInitialized };
