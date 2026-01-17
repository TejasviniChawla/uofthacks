import type { FilterCategory, OverrideType, PIIType } from './types';

// ==================== AMPLITUDE EVENT TYPES ====================

export interface FilterTriggeredEvent {
  user_type: 'viewer' | 'streamer';
  filter_category: FilterCategory;
  filter_subcategory?: string;
  confidence_score: number;
  detection_model: 'marengo' | 'pegasus';
  stream_platform: 'twitch' | 'youtube';
  streamer_id?: string;
  time_in_stream: number;
  buffer_time_remaining: number;
}

export interface FilterOverrideEvent {
  user_type: 'viewer';
  filter_category: FilterCategory;
  filter_subcategory?: string;
  confidence_score: number;
  override_type: OverrideType;
  time_to_override: number;
  session_override_count: number;
  total_override_count: number;
}

export interface SensitivityAutoAdjustedEvent {
  user_type: 'viewer';
  filter_category: FilterCategory;
  filter_subcategory?: string;
  old_threshold: number;
  new_threshold: number;
  trigger_reason: 'repeated_overrides' | 'time_decay' | 'similar_users';
  override_count_trigger: number;
  confidence_in_adjustment: number;
}

export interface SensitivityAdjustmentResponseEvent {
  user_type: 'viewer';
  filter_category: FilterCategory;
  adjustment_accepted: boolean;
  time_to_respond: number | null;
  response_type: 'explicit_accept' | 'explicit_reject' | 'implicit_accept';
}

export interface ProfileSwitchedEvent {
  user_type: 'viewer';
  from_profile: string;
  to_profile: string;
  trigger: 'manual' | 'scheduled' | 'context';
}

export interface PIIDetectedEvent {
  user_type: 'streamer';
  pii_type: PIIType;
  confidence_score: number;
  detection_model: 'marengo';
  auto_blurred: boolean;
  time_visible_before_blur: number;
}

export interface PIIWhitelistedEvent {
  user_type: 'streamer';
  pii_type: PIIType;
  specific_value_hash: string;
  reason: string;
}

export interface EmotionalStateDetectedEvent {
  user_type: 'streamer';
  emotion: string;
  tension_level: number;
  filter_adjustment_applied: number;
  predicted_risk: 'low' | 'medium' | 'high';
}

export interface RetentionSignalEvent {
  viewer_count_before: number;
  viewer_count_after: number;
  filter_events_in_window: number;
  time_window: number;
}

export interface ProcessingLatencyEvent {
  frame_capture_ms: number;
  network_to_backend_ms: number;
  twelve_labs_ms: number;
  network_to_client_ms: number;
  total_ms: number;
  within_budget: boolean;
}

export interface SessionStartEvent {
  user_type: 'viewer' | 'streamer';
  platform: 'twitch' | 'youtube';
  initial_profile: string;
  filter_count_enabled: number;
}

export interface SessionEndEvent {
  user_type: 'viewer' | 'streamer';
  session_duration: number;
  total_filtered: number;
  total_overridden: number;
  ai_adjustments_accepted: number;
  ai_adjustments_rejected: number;
}

// ==================== AMPLITUDE EVENT NAMES ====================

export const AMPLITUDE_EVENTS = {
  // Viewer events
  FILTER_TRIGGERED: 'filter_triggered',
  FILTER_OVERRIDE: 'filter_override',
  SENSITIVITY_AUTO_ADJUSTED: 'sensitivity_auto_adjusted',
  SENSITIVITY_ADJUSTMENT_RESPONSE: 'sensitivity_adjustment_response',
  PROFILE_SWITCHED: 'profile_switched',
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',

  // Streamer events
  PII_DETECTED: 'pii_detected',
  PII_WHITELISTED: 'pii_whitelisted',
  EMOTIONAL_STATE_DETECTED: 'emotional_state_detected',

  // System events
  RETENTION_SIGNAL: 'retention_signal',
  PROCESSING_LATENCY: 'processing_latency',
} as const;

// ==================== EVENT HELPER FUNCTIONS ====================

export function createFilterTriggeredEvent(
  category: FilterCategory,
  subcategory: string | undefined,
  confidence: number,
  model: 'marengo' | 'pegasus',
  platform: 'twitch' | 'youtube',
  timeInStream: number,
  bufferTimeRemaining: number
): FilterTriggeredEvent {
  return {
    user_type: 'viewer',
    filter_category: category,
    filter_subcategory: subcategory,
    confidence_score: confidence,
    detection_model: model,
    stream_platform: platform,
    time_in_stream: timeInStream,
    buffer_time_remaining: bufferTimeRemaining,
  };
}

export function createFilterOverrideEvent(
  category: FilterCategory,
  subcategory: string | undefined,
  confidence: number,
  overrideType: OverrideType,
  timeToOverride: number,
  sessionCount: number,
  totalCount: number
): FilterOverrideEvent {
  return {
    user_type: 'viewer',
    filter_category: category,
    filter_subcategory: subcategory,
    confidence_score: confidence,
    override_type: overrideType,
    time_to_override: timeToOverride,
    session_override_count: sessionCount,
    total_override_count: totalCount,
  };
}

export function createSensitivityAdjustedEvent(
  category: FilterCategory,
  subcategory: string | undefined,
  oldThreshold: number,
  newThreshold: number,
  overrideCount: number,
  confidence: number
): SensitivityAutoAdjustedEvent {
  return {
    user_type: 'viewer',
    filter_category: category,
    filter_subcategory: subcategory,
    old_threshold: oldThreshold,
    new_threshold: newThreshold,
    trigger_reason: 'repeated_overrides',
    override_count_trigger: overrideCount,
    confidence_in_adjustment: confidence,
  };
}

export function createPIIDetectedEvent(
  piiType: PIIType,
  confidence: number,
  autoBlurred: boolean,
  timeVisible: number
): PIIDetectedEvent {
  return {
    user_type: 'streamer',
    pii_type: piiType,
    confidence_score: confidence,
    detection_model: 'marengo',
    auto_blurred: autoBlurred,
    time_visible_before_blur: timeVisible,
  };
}
