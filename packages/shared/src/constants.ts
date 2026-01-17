// Shared constants for Sentinella

export const FILTER_CATEGORIES = [
  'profanity',
  'violence',
  'sexual',
  'jumpscares',
  'flashing',
  'spoilers',
  'loud_audio',
  'hate_speech'
] as const;

export const FILTER_LEVELS = ['OFF', 'LOW', 'MEDIUM', 'HIGH', 'MAXIMUM'] as const;

export const FILTER_ACTIONS = [
  'blur',
  'bleep',
  'mute',
  'dim',
  'pixelate',
  'black_box',
  'normalize'
] as const;

export const BUFFER_DURATION_MS = 5000; // 5 seconds
export const FRAME_CAPTURE_INTERVAL_MS = 200; // Capture frame every 200ms
export const WARNING_DISPLAY_SECONDS = 3; // Show warning 3 seconds before content

export const DEFAULT_FILTER_THRESHOLDS: Record<string, number> = {
  OFF: 1.0,
  LOW: 0.9,
  MEDIUM: 0.7,
  HIGH: 0.5,
  MAXIMUM: 0.3
};

export const QUICK_PRESETS = {
  gaming: {
    profanity: 'MEDIUM',
    violence: 'LOW',
    sexual: 'MEDIUM',
    jumpscares: 'HIGH',
    flashing: 'HIGH',
    spoilers: 'OFF',
    loud_audio: 'MEDIUM',
    hate_speech: 'HIGH'
  },
  family_friendly: {
    profanity: 'MAXIMUM',
    violence: 'MAXIMUM',
    sexual: 'MAXIMUM',
    jumpscares: 'HIGH',
    flashing: 'MEDIUM',
    spoilers: 'OFF',
    loud_audio: 'MEDIUM',
    hate_speech: 'MAXIMUM'
  },
  maximum_safety: {
    profanity: 'MAXIMUM',
    violence: 'MAXIMUM',
    sexual: 'MAXIMUM',
    jumpscares: 'MAXIMUM',
    flashing: 'MAXIMUM',
    spoilers: 'MAXIMUM',
    loud_audio: 'MAXIMUM',
    hate_speech: 'MAXIMUM'
  }
};

export const PLATFORMS = ['twitch', 'youtube'] as const;
export type Platform = typeof PLATFORMS[number];
