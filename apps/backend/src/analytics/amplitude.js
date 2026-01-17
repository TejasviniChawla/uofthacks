import { init, track } from '@amplitude/analytics-node';

let isInitialized = false;

export function initializeAnalytics() {
  const apiKey = process.env.AMPLITUDE_API_KEY;
  
  if (!apiKey || apiKey === 'your_amplitude_api_key_here') {
    console.warn('⚠️  Amplitude API key not configured. Analytics will be disabled.');
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
    console.log('✅ Amplitude analytics initialized');
    return { initialized: true };
  } catch (error) {
    console.error('❌ Failed to initialize Amplitude:', error);
    return null;
  }
}

export function trackEvent(client, eventName, properties = {}, userId = null) {
  if (!isInitialized) {
    // Silently fail if analytics not configured
    return;
  }

  try {
    track(eventName, properties, { userId });
  } catch (error) {
    console.error(`Error tracking event ${eventName}:`, error);
  }
}

export function trackModerationTriggered(client, properties) {
  trackEvent(client, 'moderation_triggered', {
    type: properties.type, // 'blur' or 'bleep'
    confidence: properties.confidence,
    model: properties.model, // 'marengo' or 'pegasus'
    stream_id: properties.streamId,
    timestamp: properties.timestamp || Date.now()
  }, properties.userId);
}

export function trackUserOverride(client, properties) {
  trackEvent(client, 'user_override', {
    original_type: properties.originalType,
    latency_ms: properties.latencyMs,
    stream_id: properties.streamId,
    moderation_id: properties.moderationId,
    timestamp: properties.timestamp || Date.now()
  }, properties.userId);
}

export function trackRetentionSignal(client, properties) {
  trackEvent(client, 'retention_signal', {
    viewer_count: properties.viewerCount,
    chat_velocity: properties.chatVelocity,
    stream_id: properties.streamId,
    timestamp: properties.timestamp || Date.now()
  }, properties.userId);
}

export function trackSensitivityShift(client, properties) {
  trackEvent(client, 'sensitivity_shift', {
    old_threshold: properties.oldThreshold,
    new_threshold: properties.newThreshold,
    moderation_type: properties.moderationType,
    stream_id: properties.streamId,
    reason: properties.reason,
    timestamp: properties.timestamp || Date.now()
  }, properties.userId);
}

export { isInitialized };
