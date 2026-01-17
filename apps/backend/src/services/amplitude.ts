import * as amplitude from '@amplitude/analytics-node';

const AMPLITUDE_API_KEY = process.env.AMPLITUDE_API_KEY || '';
const MOCK_MODE = !AMPLITUDE_API_KEY || AMPLITUDE_API_KEY === 'your_amplitude_api_key';

// Initialize Amplitude
if (!MOCK_MODE) {
  amplitude.init(AMPLITUDE_API_KEY);
}

/**
 * Track an event to Amplitude
 */
export async function trackEvent(
  userId: string,
  eventName: string,
  eventProperties: Record<string, any>
): Promise<void> {
  if (MOCK_MODE) {
    console.log(`[Amplitude Mock] ${eventName}:`, {
      userId,
      ...eventProperties,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    amplitude.track(eventName, eventProperties, {
      user_id: userId,
    });
  } catch (error) {
    console.error('Amplitude tracking error:', error);
  }
}

/**
 * Set user properties in Amplitude
 */
export async function setUserProperties(
  userId: string,
  properties: Record<string, any>
): Promise<void> {
  if (MOCK_MODE) {
    console.log(`[Amplitude Mock] Set User Properties:`, {
      userId,
      ...properties,
    });
    return;
  }

  try {
    const identifyEvent = new amplitude.Identify();
    for (const [key, value] of Object.entries(properties)) {
      identifyEvent.set(key, value);
    }
    amplitude.identify(identifyEvent, { user_id: userId });
  } catch (error) {
    console.error('Amplitude identify error:', error);
  }
}

/**
 * Increment a user property
 */
export async function incrementUserProperty(
  userId: string,
  property: string,
  value: number = 1
): Promise<void> {
  if (MOCK_MODE) {
    console.log(`[Amplitude Mock] Increment:`, {
      userId,
      property,
      value,
    });
    return;
  }

  try {
    const identifyEvent = new amplitude.Identify();
    identifyEvent.add(property, value);
    amplitude.identify(identifyEvent, { user_id: userId });
  } catch (error) {
    console.error('Amplitude increment error:', error);
  }
}

/**
 * Track a revenue event
 */
export async function trackRevenue(
  userId: string,
  productId: string,
  price: number,
  quantity: number = 1
): Promise<void> {
  if (MOCK_MODE) {
    console.log(`[Amplitude Mock] Revenue:`, {
      userId,
      productId,
      price,
      quantity,
    });
    return;
  }

  try {
    const revenueEvent = new amplitude.Revenue()
      .setProductId(productId)
      .setPrice(price)
      .setQuantity(quantity);
    amplitude.revenue(revenueEvent, { user_id: userId });
  } catch (error) {
    console.error('Amplitude revenue error:', error);
  }
}

/**
 * Flush all pending events (useful before shutdown)
 */
export async function flushEvents(): Promise<void> {
  if (MOCK_MODE) {
    console.log('[Amplitude Mock] Flushing events...');
    return;
  }

  try {
    await amplitude.flush();
  } catch (error) {
    console.error('Amplitude flush error:', error);
  }
}

// ==================== SENTINELLA-SPECIFIC TRACKING ====================

/**
 * Track filter trigger with full context
 */
export async function trackFilterTriggered(
  userId: string,
  category: string,
  subcategory: string | undefined,
  confidence: number,
  model: 'marengo' | 'pegasus',
  platform: 'twitch' | 'youtube',
  timeInStream: number,
  bufferTimeRemaining: number
): Promise<void> {
  await trackEvent(userId, 'filter_triggered', {
    user_type: 'viewer',
    filter_category: category,
    filter_subcategory: subcategory,
    confidence_score: confidence,
    detection_model: model,
    stream_platform: platform,
    time_in_stream: timeInStream,
    buffer_time_remaining: bufferTimeRemaining,
  });
}

/**
 * Track when AI auto-adjusts sensitivity
 */
export async function trackSensitivityAdjusted(
  userId: string,
  category: string,
  subcategory: string | undefined,
  oldThreshold: number,
  newThreshold: number,
  overrideCount: number,
  confidence: number
): Promise<void> {
  await trackEvent(userId, 'sensitivity_auto_adjusted', {
    user_type: 'viewer',
    filter_category: category,
    filter_subcategory: subcategory,
    old_threshold: oldThreshold,
    new_threshold: newThreshold,
    trigger_reason: 'repeated_overrides',
    override_count_trigger: overrideCount,
    confidence_in_adjustment: confidence,
  });
}

/**
 * Track processing latency for performance monitoring
 */
export async function trackLatency(
  frameCaptureMs: number,
  networkToBackendMs: number,
  twelveLabsMs: number,
  networkToClientMs: number
): Promise<void> {
  const totalMs = frameCaptureMs + networkToBackendMs + twelveLabsMs + networkToClientMs;
  
  await trackEvent('system', 'processing_latency', {
    frame_capture_ms: frameCaptureMs,
    network_to_backend_ms: networkToBackendMs,
    twelve_labs_ms: twelveLabsMs,
    network_to_client_ms: networkToClientMs,
    total_ms: totalMs,
    within_budget: totalMs <= 5000,
  });
}

