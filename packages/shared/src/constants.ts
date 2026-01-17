import type { FilterCategory, FilterLevel, FilterConfig, VisualFilterType, AudioFilterType } from './types';

// ==================== BUFFER SETTINGS ====================

export const BUFFER_DURATION_MS = 5000; // 5 second buffer
export const FRAME_CAPTURE_INTERVAL_MS = 200; // Capture every 200ms
export const AUDIO_CHUNK_DURATION_MS = 1000; // 1 second audio chunks

// ==================== FILTER DEFAULTS ====================

export const FILTER_LEVEL_THRESHOLDS: Record<FilterLevel, number> = {
  off: 1.0,
  low: 0.9,
  medium: 0.7,
  high: 0.5,
  maximum: 0.3,
};

export const DEFAULT_FILTER_CONFIGS: FilterConfig[] = [
  {
    category: 'profanity',
    level: 'off',
    threshold: 1.0,
    visualFilter: 'blur',
    audioFilter: 'bleep',
    subcategories: {
      mild: { enabled: false, threshold: 0.9 },
      moderate: { enabled: false, threshold: 0.7 },
      severe: { enabled: false, threshold: 0.5 },
      slurs: { enabled: true, threshold: 0.3 },
    },
  },
  {
    category: 'violence',
    level: 'off',
    threshold: 1.0,
    visualFilter: 'blur',
    audioFilter: 'muffle',
    subcategories: {
      cartoon: { enabled: false, threshold: 0.9 },
      realistic: { enabled: false, threshold: 0.7 },
      gore: { enabled: true, threshold: 0.3 },
    },
  },
  {
    category: 'sexual',
    level: 'high',
    threshold: 0.5,
    visualFilter: 'blur',
    audioFilter: 'silence',
    subcategories: {
      suggestive: { enabled: false, threshold: 0.8 },
      nudity: { enabled: true, threshold: 0.4 },
    },
  },
  {
    category: 'jumpscares',
    level: 'off',
    threshold: 1.0,
    visualFilter: 'dim',
    audioFilter: 'normalize',
    subcategories: {
      audio_sudden: { enabled: false, threshold: 0.7 },
      visual_shock: { enabled: false, threshold: 0.7 },
    },
  },
  {
    category: 'flashing',
    level: 'off',
    threshold: 1.0,
    visualFilter: 'dim',
    audioFilter: 'normalize',
    subcategories: {
      rapid_flashes: { enabled: false, threshold: 0.6 },
      seizure_risk: { enabled: true, threshold: 0.3 },
    },
  },
  {
    category: 'spoilers',
    level: 'off',
    threshold: 1.0,
    visualFilter: 'blur',
    audioFilter: 'silence',
  },
  {
    category: 'loud_audio',
    level: 'off',
    threshold: 1.0,
    visualFilter: 'blur',
    audioFilter: 'normalize',
    subcategories: {
      screaming: { enabled: false, threshold: 0.7 },
      sudden_volume: { enabled: false, threshold: 0.6 },
    },
  },
  {
    category: 'hate_speech',
    level: 'high',
    threshold: 0.5,
    visualFilter: 'blur',
    audioFilter: 'silence',
    subcategories: {
      discriminatory: { enabled: true, threshold: 0.4 },
    },
  },
];

// ==================== FILTER PRESETS ====================

export const FILTER_PRESETS = {
  gaming: {
    profanity: 'medium',
    violence: 'low',
    sexual: 'high',
    jumpscares: 'off',
    flashing: 'medium',
    spoilers: 'off',
    loud_audio: 'off',
    hate_speech: 'high',
  },
  family_friendly: {
    profanity: 'maximum',
    violence: 'high',
    sexual: 'maximum',
    jumpscares: 'high',
    flashing: 'high',
    spoilers: 'off',
    loud_audio: 'medium',
    hate_speech: 'maximum',
  },
  maximum_safety: {
    profanity: 'maximum',
    violence: 'maximum',
    sexual: 'maximum',
    jumpscares: 'maximum',
    flashing: 'maximum',
    spoilers: 'maximum',
    loud_audio: 'maximum',
    hate_speech: 'maximum',
  },
  minimal: {
    profanity: 'off',
    violence: 'off',
    sexual: 'off',
    jumpscares: 'off',
    flashing: 'off',
    spoilers: 'off',
    loud_audio: 'off',
    hate_speech: 'off',
  },
} as const;

// ==================== FILTER ICONS ====================

export const FILTER_ICONS: Record<FilterCategory, string> = {
  profanity: '🔇',
  violence: '🩸',
  sexual: '🔞',
  jumpscares: '⚡',
  flashing: '💥',
  spoilers: '🎮',
  loud_audio: '📢',
  hate_speech: '🚫',
};

export const FILTER_LABELS: Record<FilterCategory, string> = {
  profanity: 'Profanity',
  violence: 'Violence',
  sexual: 'Sexual Content',
  jumpscares: 'Jumpscares',
  flashing: 'Flashing/Strobing',
  spoilers: 'Spoilers',
  loud_audio: 'Loud Audio',
  hate_speech: 'Hate Speech',
};

// ==================== AI LEARNING SETTINGS ====================

export const LEARNING_THRESHOLDS = {
  MIN_OVERRIDES_FOR_ADJUSTMENT: 3,
  MIN_OVERRIDE_RATE: 0.7, // 70% override rate triggers adjustment
  ADJUSTMENT_STEP: 0.15, // Adjust threshold by 15%
  MAX_ADJUSTMENT: 0.4, // Maximum cumulative adjustment
  CONFIDENCE_DECAY_RATE: 0.1, // Confidence decays over time
  SESSIONS_FOR_HIGH_CONFIDENCE: 5,
};

// ==================== VISUAL FILTER SETTINGS ====================

export const VISUAL_FILTER_INTENSITIES: Record<VisualFilterType, Record<FilterLevel, number>> = {
  blur: {
    off: 0,
    low: 5,
    medium: 15,
    high: 30,
    maximum: 50,
  },
  black_box: {
    off: 0,
    low: 0.3,
    medium: 0.6,
    high: 0.85,
    maximum: 1.0,
  },
  pixelate: {
    off: 0,
    low: 8,
    medium: 16,
    high: 32,
    maximum: 64,
  },
  dim: {
    off: 0,
    low: 0.2,
    medium: 0.4,
    high: 0.6,
    maximum: 0.8,
  },
};

// ==================== AUDIO FILTER SETTINGS ====================

export const AUDIO_FILTER_SETTINGS = {
  BLEEP_FREQUENCY: 1000, // Hz
  BLEEP_DURATION_PADDING: 100, // ms before/after detected word
  MUFFLE_CUTOFF: 500, // Hz low-pass filter
  NORMALIZE_TARGET_DB: -20,
  NORMALIZE_ATTACK_MS: 10,
  NORMALIZE_RELEASE_MS: 100,
};

// ==================== LATENCY BUDGET ====================

export const LATENCY_BUDGET_MS = {
  FRAME_CAPTURE: 50,
  NETWORK_TO_BACKEND: 100,
  TWELVE_LABS_PROCESSING: 1500,
  NETWORK_TO_CLIENT: 100,
  BUFFER_MARGIN: 3000,
  TOTAL: 5000,
};

// ==================== SUPPORTED PLATFORMS ====================

export const SUPPORTED_PLATFORMS = {
  twitch: {
    name: 'Twitch',
    hostPatterns: ['twitch.tv', 'www.twitch.tv'],
    videoSelector: 'video',
  },
  youtube: {
    name: 'YouTube',
    hostPatterns: ['youtube.com', 'www.youtube.com', 'youtu.be'],
    videoSelector: 'video.html5-main-video',
  },
} as const;

// ==================== PII DETECTION SETTINGS ====================

export const PII_DETECTION_CONFIDENCE_THRESHOLD = 0.75;
export const PII_BLUR_PADDING = 10; // pixels around detected PII
