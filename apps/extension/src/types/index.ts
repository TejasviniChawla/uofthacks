// Re-export shared types
export type FilterCategory =
  | 'profanity'
  | 'violence'
  | 'sexual'
  | 'jumpscares'
  | 'flashing'
  | 'spoilers'
  | 'loud_audio'
  | 'hate_speech';

export type FilterLevel = 'off' | 'low' | 'medium' | 'high' | 'maximum';

export type VisualFilterType = 'blur' | 'black_box' | 'pixelate' | 'dim';
export type AudioFilterType = 'bleep' | 'silence' | 'muffle' | 'normalize';

export interface FilterConfig {
  category: FilterCategory;
  level: FilterLevel;
  threshold: number;
  visualFilter: VisualFilterType;
  audioFilter: AudioFilterType;
  subcategories?: {
    [key: string]: {
      enabled: boolean;
      threshold: number;
    };
  };
}

export interface UserProfile {
  id: string;
  name: string;
  isDefault: boolean;
  isLocked: boolean;
  filters: FilterConfig[];
}

export interface SessionStats {
  totalFiltered: number;
  filteredByCategory: Record<FilterCategory, number>;
  totalRevealed: number;
  sessionStartTime: number;
  aiAdjustments: number;
}

export interface LearnedPreference {
  category: FilterCategory;
  subcategory?: string;
  status: 'learning' | 'adjusted' | 'stable';
  confidence: number;
  description: string;
}

export interface Detection {
  id: string;
  type: FilterCategory;
  subtype?: string;
  confidence: number;
  bbox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  timestamp: number;
  duration?: number;
}

export interface FilterInstruction {
  detectionId: string;
  filterType: VisualFilterType | AudioFilterType;
  startTime: number;
  endTime: number;
  bbox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  intensity: number;
}

export interface WSMessage {
  type: string;
  payload: any;
  timestamp: number;
  messageId: string;
}

export interface AIAdjustment {
  category: FilterCategory;
  subcategory?: string;
  oldThreshold: number;
  newThreshold: number;
  confidence: number;
  reason: string;
}
