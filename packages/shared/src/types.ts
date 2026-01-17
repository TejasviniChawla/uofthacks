// Shared types for Sentinella platform

export type UserType = 'viewer' | 'streamer' | 'moderator';

export type FilterCategory = 
  | 'profanity' 
  | 'violence' 
  | 'sexual' 
  | 'jumpscares' 
  | 'flashing' 
  | 'spoilers' 
  | 'loud_audio' 
  | 'hate_speech';

export type FilterLevel = 'OFF' | 'LOW' | 'MEDIUM' | 'HIGH' | 'MAXIMUM';

export type FilterAction = 'blur' | 'bleep' | 'mute' | 'dim' | 'pixelate' | 'black_box' | 'normalize';

export type OverrideType = 'reveal_once' | 'reveal_always' | 'reveal_hold';

export interface FilterConfig {
  category: FilterCategory;
  level: FilterLevel;
  enabled: boolean;
  threshold: number; // 0.0 - 1.0
  action: FilterAction;
  subcategories?: Record<string, boolean>;
}

export interface UserPreferences {
  userId: string;
  profileName: string;
  isDefault: boolean;
  isLocked: boolean;
  filters: Record<FilterCategory, FilterConfig>;
  createdAt: string;
  updatedAt: string;
}

export interface Detection {
  id: string;
  type: 'visual_pii' | 'audio_violation' | 'content_warning';
  category: FilterCategory;
  subcategory?: string;
  confidence: number;
  timestamp: number;
  bbox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  startTime?: number;
  endTime?: number;
  text?: string;
  model: 'marengo' | 'pegasus';
  streamId?: string;
  streamerId?: string;
}

export interface FilterInstruction {
  detectionId: string;
  action: FilterAction;
  bbox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  startTime: number;
  endTime: number;
  intensity?: number; // 0.0 - 1.0
}

export interface LearnedPreference {
  id: string;
  userId: string;
  filterCategory: FilterCategory;
  filterSubcategory?: string;
  originalThreshold: number;
  learnedThreshold: number;
  confidence: number;
  overrideCount: number;
  lastUpdated: string;
}

export interface SessionStats {
  itemsFiltered: number;
  itemsByCategory: Record<FilterCategory, number>;
  itemsRevealed: number;
  overrides: number;
  sessionStart: number;
}

export interface EmotionalState {
  emotion: string;
  tensionLevel: number; // 0.0 - 1.0
  predictedTrajectory: 'escalating' | 'stable' | 'decreasing';
  profanityRisk: 'low' | 'medium' | 'high';
  suggestedFilterAdjustment: number; // multiplier
}

export interface PIIDetection {
  type: 'credit_card' | 'address' | 'phone' | 'email' | 'government_id' | 'login_credentials' | 'personal_name';
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  valueHash?: string; // hashed for privacy
  timestamp: number;
}

export interface StreamerReport {
  streamId: string;
  piiDetections: PIIDetection[];
  nearMisses: Array<{
    timestamp: number;
    type: string;
    confidence: number;
    thumbnail?: string;
  }>;
  stats: {
    totalFiltered: number;
    leaksPrevented: number;
    averageConfidence: number;
  };
}

// WebSocket message types
export interface WSMessage {
  type: 'frame_analysis' | 'audio_analysis' | 'filter_instruction' | 'warning' | 'error';
  data: any;
  timestamp: number;
}

export interface FrameAnalysisRequest {
  frame: string; // base64
  timestamp: number;
  userId: string;
  streamId?: string;
}

export interface AudioAnalysisRequest {
  audio: string; // base64
  timestamp: number;
  userId: string;
  streamId?: string;
}

// Amplitude event types
export interface AmplitudeEvent {
  event_type: string;
  event_properties: Record<string, any>;
  user_id?: string;
  timestamp?: number;
}
