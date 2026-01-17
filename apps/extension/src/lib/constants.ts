import type { FilterConfig, FilterCategory } from '../types';

export const API_URL = 'http://localhost:3001';
export const WS_URL = 'ws://localhost:3001/ws/realtime';

export const BUFFER_DURATION_MS = 5000;
export const FRAME_CAPTURE_INTERVAL_MS = 200;

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
  flashing: 'Flashing',
  spoilers: 'Spoilers',
  loud_audio: 'Loud Audio',
  hate_speech: 'Hate Speech',
};

export const FILTER_LEVEL_LABELS: Record<string, string> = {
  off: 'Off',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  maximum: 'Maximum',
};

export const DEFAULT_FILTER_CONFIGS: FilterConfig[] = [
  {
    category: 'profanity',
    level: 'off',
    threshold: 1.0,
    visualFilter: 'blur',
    audioFilter: 'bleep',
  },
  {
    category: 'violence',
    level: 'off',
    threshold: 1.0,
    visualFilter: 'blur',
    audioFilter: 'muffle',
  },
  {
    category: 'sexual',
    level: 'high',
    threshold: 0.5,
    visualFilter: 'blur',
    audioFilter: 'silence',
  },
  {
    category: 'jumpscares',
    level: 'off',
    threshold: 1.0,
    visualFilter: 'dim',
    audioFilter: 'normalize',
  },
  {
    category: 'flashing',
    level: 'off',
    threshold: 1.0,
    visualFilter: 'dim',
    audioFilter: 'normalize',
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
  },
  {
    category: 'hate_speech',
    level: 'high',
    threshold: 0.5,
    visualFilter: 'blur',
    audioFilter: 'silence',
  },
];

export const PRESET_CONFIGS = {
  gaming: {
    name: 'Gaming',
    description: 'Balanced for gaming streams',
    filters: {
      profanity: 'medium',
      violence: 'low',
      sexual: 'high',
      jumpscares: 'off',
      flashing: 'medium',
      spoilers: 'off',
      loud_audio: 'off',
      hate_speech: 'high',
    },
  },
  family: {
    name: 'Family Friendly',
    description: 'Safe for all ages',
    filters: {
      profanity: 'maximum',
      violence: 'high',
      sexual: 'maximum',
      jumpscares: 'high',
      flashing: 'high',
      spoilers: 'off',
      loud_audio: 'medium',
      hate_speech: 'maximum',
    },
  },
  maximum: {
    name: 'Maximum Safety',
    description: 'Filter everything',
    filters: {
      profanity: 'maximum',
      violence: 'maximum',
      sexual: 'maximum',
      jumpscares: 'maximum',
      flashing: 'maximum',
      spoilers: 'maximum',
      loud_audio: 'maximum',
      hate_speech: 'maximum',
    },
  },
  minimal: {
    name: 'Minimal',
    description: 'Almost no filtering',
    filters: {
      profanity: 'off',
      violence: 'off',
      sexual: 'off',
      jumpscares: 'off',
      flashing: 'off',
      spoilers: 'off',
      loud_audio: 'off',
      hate_speech: 'off',
    },
  },
} as const;

