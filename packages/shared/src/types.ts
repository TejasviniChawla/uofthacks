// ==================== USER TYPES ====================

export type UserType = 'viewer' | 'streamer' | 'moderator';

export interface User {
  id: string;
  userType: UserType;
  email?: string;
  createdAt: Date;
  lastActive: Date;
}

// ==================== FILTER TYPES ====================

export type FilterCategory =
  | 'profanity'
  | 'violence'
  | 'sexual'
  | 'jumpscares'
  | 'flashing'
  | 'spoilers'
  | 'loud_audio'
  | 'hate_speech';

export type FilterSubcategory = {
  profanity: 'mild' | 'moderate' | 'severe' | 'slurs';
  violence: 'cartoon' | 'realistic' | 'gore';
  sexual: 'suggestive' | 'nudity';
  jumpscares: 'audio_sudden' | 'visual_shock';
  flashing: 'rapid_flashes' | 'seizure_risk';
  spoilers: 'game_endings' | 'plot_reveals';
  loud_audio: 'screaming' | 'sudden_volume';
  hate_speech: 'discriminatory';
};

export type FilterLevel = 'off' | 'low' | 'medium' | 'high' | 'maximum';

export type VisualFilterType = 'blur' | 'black_box' | 'pixelate' | 'dim';
export type AudioFilterType = 'bleep' | 'silence' | 'muffle' | 'normalize';

export interface FilterConfig {
  category: FilterCategory;
  level: FilterLevel;
  threshold: number; // 0.0 - 1.0
  visualFilter: VisualFilterType;
  audioFilter: AudioFilterType;
  subcategories?: {
    [key: string]: {
      enabled: boolean;
      threshold: number;
    };
  };
}

export interface UserPreferences {
  id: string;
  userId: string;
  profileName: string;
  isDefault: boolean;
  isLocked: boolean;
  filters: FilterConfig[];
  createdAt: Date;
  updatedAt: Date;
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
  lastUpdated: Date;
}

// ==================== DETECTION TYPES ====================

export type PIIType =
  | 'credit_card'
  | 'address'
  | 'phone_number'
  | 'email'
  | 'government_id'
  | 'personal_name'
  | 'login_credentials';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Detection {
  id: string;
  type: FilterCategory | PIIType;
  subtype?: string;
  confidence: number;
  bbox?: BoundingBox;
  timestamp: number;
  duration?: number;
  model: 'marengo' | 'pegasus';
}

export interface FilterInstruction {
  detectionId: string;
  filterType: VisualFilterType | AudioFilterType;
  startTime: number;
  endTime: number;
  bbox?: BoundingBox;
  intensity: number; // 0.0 - 1.0
}

export interface EmotionalState {
  currentEmotion: 'calm' | 'excited' | 'frustrated' | 'angry' | 'happy' | 'sad';
  tensionLevel: number; // 0.0 - 1.0
  predictedTrajectory: 'stable' | 'escalating' | 'de-escalating';
  profanityRisk: 'low' | 'medium' | 'high';
  suggestedFilterAdjustment: number; // multiplier
}

// ==================== ANALYSIS RESPONSE TYPES ====================

export interface FrameAnalysisRequest {
  frame: string; // base64
  timestamp: number;
  userId: string;
  streamId?: string;
  platform?: 'twitch' | 'youtube';
}

export interface FrameAnalysisResponse {
  detections: Detection[];
  filterInstructions: FilterInstruction[];
  processingTime: number;
}

export interface AudioAnalysisRequest {
  audio: string; // base64
  timestamp: number;
  userId: string;
  streamId?: string;
}

export interface AudioAnalysisResponse {
  detections: Detection[];
  emotionalState?: EmotionalState;
  filterInstructions: FilterInstruction[];
  processingTime: number;
}

// ==================== OVERRIDE TYPES ====================

export type OverrideType = 'reveal_once' | 'reveal_always' | 'reveal_hold';

export interface Override {
  filterId: string;
  overrideType: OverrideType;
  timestamp: number;
  category: FilterCategory;
  subcategory?: string;
  confidence: number;
}

// ==================== SESSION TYPES ====================

export interface SessionStats {
  totalFiltered: number;
  filteredByCategory: Record<FilterCategory, number>;
  totalRevealed: number;
  revealedByCategory: Record<FilterCategory, number>;
  sessionStartTime: number;
  aiAdjustments: number;
}

// ==================== STREAMER TYPES ====================

export interface StreamerWhitelist {
  id: string;
  userId: string;
  piiType: PIIType;
  valueHash: string;
  description: string;
  createdAt: Date;
}

export interface StreamSafetyReport {
  streamId: string;
  totalPIIDetected: number;
  piiDetections: Array<{
    type: PIIType;
    timestamp: number;
    confidence: number;
    autoBlurred: boolean;
    wasWhitelisted: boolean;
  }>;
  nearMisses: Array<{
    type: PIIType;
    timestamp: number;
    description: string;
    thumbnailUrl?: string;
  }>;
  emotionalHighlights: Array<{
    timestamp: number;
    emotion: string;
    tensionLevel: number;
  }>;
  recommendations: string[];
}

// ==================== WEBSOCKET MESSAGE TYPES ====================

export type WSMessageType =
  | 'frame_analysis'
  | 'audio_analysis'
  | 'filter_instruction'
  | 'override'
  | 'preference_update'
  | 'session_stats'
  | 'ai_adjustment'
  | 'error';

export interface WSMessage<T = unknown> {
  type: WSMessageType;
  payload: T;
  timestamp: number;
  messageId: string;
}

export interface WSFrameMessage {
  type: 'frame_analysis';
  payload: {
    frame: string;
    timestamp: number;
  };
}

export interface WSFilterInstructionMessage {
  type: 'filter_instruction';
  payload: {
    instructions: FilterInstruction[];
    bufferPosition: number;
  };
}

export interface WSAIAdjustmentMessage {
  type: 'ai_adjustment';
  payload: {
    category: FilterCategory;
    subcategory?: string;
    oldThreshold: number;
    newThreshold: number;
    confidence: number;
    reason: string;
  };
}
