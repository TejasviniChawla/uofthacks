import type { Detection, EmotionalState, BoundingBox, PIIType } from '@sentinella/shared';
import { v4 as uuid } from 'uuid';

const TWELVE_LABS_API_KEY = process.env.TWELVE_LABS_API_KEY || 'tlk_1QR75YW2AXEGJG2BV950S0QANMJA';
const TWELVE_LABS_BASE_URL = 'https://api.twelvelabs.io/v1.2';

interface TwelveLabsTextDetection {
  text: string;
  bbox: [number, number, number, number];
  confidence: number;
}

interface TwelveLabsContentModeration {
  category: string;
  confidence: number;
  bbox?: [number, number, number, number];
}

interface TwelveLabsEmotionDetection {
  emotion: string;
  confidence: number;
  timestamp: number;
}

// Mock responses for development when API key is not set
const MOCK_MODE = !TWELVE_LABS_API_KEY || TWELVE_LABS_API_KEY === 'your_twelve_labs_api_key';

/**
 * Analyze a video frame using Twelve Labs Marengo for content moderation
 */
export async function analyzeFrame(frameBase64: string): Promise<Detection[]> {
  if (MOCK_MODE) {
    return mockFrameAnalysis();
  }

  try {
    const response = await fetch(`${TWELVE_LABS_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TWELVE_LABS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'marengo',
        input: {
          type: 'image',
          data: frameBase64,
        },
        tasks: [
          'content_moderation',
          'text_detection',
          'object_detection',
        ],
        custom_prompts: [
          'Detect violent or disturbing content',
          'Detect nudity or sexual content',
          'Detect any flashing or strobe effects',
          'Identify any text or graphics that could be spoilers',
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Twelve Labs API error: ${response.status}`);
    }

    const data = await response.json();
    return parseFrameAnalysisResponse(data);
  } catch (error) {
    console.error('Twelve Labs frame analysis error:', error);
    return [];
  }
}

/**
 * Analyze audio using Twelve Labs Pegasus for emotional trajectory and content
 */
export async function analyzeAudio(audioBase64: string): Promise<{
  detections: Detection[];
  emotionalState: EmotionalState | null;
}> {
  if (MOCK_MODE) {
    return mockAudioAnalysis();
  }

  try {
    const response = await fetch(`${TWELVE_LABS_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TWELVE_LABS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'pegasus',
        input: {
          type: 'audio',
          data: audioBase64,
        },
        tasks: [
          'speech_to_text',
          'emotion_detection',
          'content_moderation',
        ],
        emotional_trajectory: true,
        predict_upcoming: 5,
      }),
    });

    if (!response.ok) {
      throw new Error(`Twelve Labs API error: ${response.status}`);
    }

    const data = await response.json();
    return parseAudioAnalysisResponse(data);
  } catch (error) {
    console.error('Twelve Labs audio analysis error:', error);
    return { detections: [], emotionalState: null };
  }
}

/**
 * Analyze frame specifically for PII detection (streamer use case)
 */
export async function analyzeFrameForPII(
  frameBase64: string, 
  whitelist: Array<{ valueHash: string; piiType: string }>
): Promise<Detection[]> {
  if (MOCK_MODE) {
    return mockPIIAnalysis();
  }

  try {
    const response = await fetch(`${TWELVE_LABS_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TWELVE_LABS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'marengo',
        input: {
          type: 'image',
          data: frameBase64,
        },
        tasks: ['text_detection', 'pii_detection'],
        custom_prompts: [
          'Detect any personally identifiable information',
          'Identify credit card numbers or partial numbers',
          'Find any visible addresses or location information',
          'Detect login screens with credentials visible',
          'Identify any phone numbers',
          'Detect email addresses',
          'Find any government ID or document numbers',
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Twelve Labs API error: ${response.status}`);
    }

    const data = await response.json();
    const detections = parsePIIAnalysisResponse(data);

    // Filter out whitelisted items
    return detections.filter(detection => {
      const hash = hashValue(detection.id); // Simplified - in real impl would hash detected value
      return !whitelist.some(w => w.valueHash === hash);
    });
  } catch (error) {
    console.error('Twelve Labs PII analysis error:', error);
    return [];
  }
}

/**
 * Search a recorded stream for near-misses using Twelve Labs search
 */
export async function searchStreamForNearMisses(streamId: string): Promise<Array<{
  type: PIIType;
  timestamp: number;
  description: string;
  thumbnailUrl?: string;
}>> {
  if (MOCK_MODE) {
    return mockNearMissSearch();
  }

  try {
    const response = await fetch(`${TWELVE_LABS_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TWELVE_LABS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_id: streamId,
        queries: [
          'moments where personal information was almost visible',
          'close calls with credit cards or documents',
          'times when sensitive information appeared on screen',
          'brief glimpses of private data',
        ],
        return_timestamps: true,
        return_thumbnails: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Twelve Labs API error: ${response.status}`);
    }

    const data = await response.json();
    return parseNearMissResponse(data);
  } catch (error) {
    console.error('Twelve Labs search error:', error);
    return [];
  }
}

// ==================== RESPONSE PARSERS ====================

function parseFrameAnalysisResponse(data: any): Detection[] {
  const detections: Detection[] = [];

  // Parse content moderation results
  if (data.content_moderation) {
    for (const mod of data.content_moderation) {
      const detection = mapContentModerationToDetection(mod);
      if (detection) {
        detections.push(detection);
      }
    }
  }

  return detections;
}

function parseAudioAnalysisResponse(data: any): {
  detections: Detection[];
  emotionalState: EmotionalState | null;
} {
  const detections: Detection[] = [];
  let emotionalState: EmotionalState | null = null;

  // Parse speech content moderation
  if (data.content_moderation) {
    for (const mod of data.content_moderation) {
      if (mod.category === 'profanity' || mod.category === 'hate_speech') {
        detections.push({
          id: uuid(),
          type: mod.category,
          subtype: mod.severity,
          confidence: mod.confidence,
          timestamp: mod.timestamp || Date.now(),
          duration: mod.duration || 500,
          model: 'pegasus',
        });
      }
    }
  }

  // Parse emotional trajectory
  if (data.emotional_trajectory) {
    emotionalState = {
      currentEmotion: data.emotional_trajectory.current || 'calm',
      tensionLevel: data.emotional_trajectory.tension || 0.3,
      predictedTrajectory: data.emotional_trajectory.trajectory || 'stable',
      profanityRisk: calculateProfanityRisk(data.emotional_trajectory),
      suggestedFilterAdjustment: calculateFilterAdjustment(data.emotional_trajectory),
    };
  }

  return { detections, emotionalState };
}

function parsePIIAnalysisResponse(data: any): Detection[] {
  const detections: Detection[] = [];

  if (data.pii_detections) {
    for (const pii of data.pii_detections) {
      detections.push({
        id: uuid(),
        type: pii.type as PIIType,
        confidence: pii.confidence,
        bbox: pii.bbox ? {
          x: pii.bbox[0],
          y: pii.bbox[1],
          width: pii.bbox[2],
          height: pii.bbox[3],
        } : undefined,
        timestamp: Date.now(),
        model: 'marengo',
      });
    }
  }

  if (data.text_detections) {
    for (const text of data.text_detections) {
      const piiType = detectPIIFromText(text.text);
      if (piiType) {
        detections.push({
          id: uuid(),
          type: piiType,
          confidence: text.confidence * 0.9, // Slight reduction for regex-based detection
          bbox: text.bbox ? {
            x: text.bbox[0],
            y: text.bbox[1],
            width: text.bbox[2],
            height: text.bbox[3],
          } : undefined,
          timestamp: Date.now(),
          model: 'marengo',
        });
      }
    }
  }

  return detections;
}

function parseNearMissResponse(data: any): Array<{
  type: PIIType;
  timestamp: number;
  description: string;
  thumbnailUrl?: string;
}> {
  if (!data.results) return [];

  return data.results.map((result: any) => ({
    type: result.detected_type || 'personal_name',
    timestamp: result.timestamp,
    description: result.description || 'Potential PII detected',
    thumbnailUrl: result.thumbnail_url,
  }));
}

// ==================== HELPER FUNCTIONS ====================

function mapContentModerationToDetection(mod: TwelveLabsContentModeration): Detection | null {
  const categoryMap: Record<string, string> = {
    'violence': 'violence',
    'gore': 'violence',
    'nudity': 'sexual',
    'sexual_content': 'sexual',
    'hate_speech': 'hate_speech',
    'profanity': 'profanity',
  };

  const type = categoryMap[mod.category];
  if (!type) return null;

  return {
    id: uuid(),
    type: type as any,
    subtype: mod.category,
    confidence: mod.confidence,
    bbox: mod.bbox ? {
      x: mod.bbox[0],
      y: mod.bbox[1],
      width: mod.bbox[2],
      height: mod.bbox[3],
    } : undefined,
    timestamp: Date.now(),
    model: 'marengo',
  };
}

function detectPIIFromText(text: string): PIIType | null {
  // Credit card patterns
  if (/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/.test(text)) {
    return 'credit_card';
  }

  // Phone number patterns
  if (/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(text)) {
    return 'phone_number';
  }

  // Email patterns
  if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text)) {
    return 'email';
  }

  // SSN patterns
  if (/\b\d{3}[-]?\d{2}[-]?\d{4}\b/.test(text)) {
    return 'government_id';
  }

  // Address patterns (simplified)
  if (/\b\d+\s+\w+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr)\b/i.test(text)) {
    return 'address';
  }

  return null;
}

function calculateProfanityRisk(trajectory: any): 'low' | 'medium' | 'high' {
  const tension = trajectory.tension || 0;
  if (tension > 0.7) return 'high';
  if (tension > 0.4) return 'medium';
  return 'low';
}

function calculateFilterAdjustment(trajectory: any): number {
  const tension = trajectory.tension || 0;
  // Higher tension = lower threshold (more aggressive filtering)
  return 1 + (tension * 0.5);
}

function hashValue(value: string): string {
  // Simple hash for demo - in production use proper hashing
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// ==================== MOCK FUNCTIONS FOR DEVELOPMENT ====================

function mockFrameAnalysis(): Detection[] {
  // Randomly return detections for demo purposes
  const rand = Math.random();
  
  if (rand < 0.1) {
    return [{
      id: uuid(),
      type: 'violence',
      subtype: 'cartoon',
      confidence: 0.75 + Math.random() * 0.2,
      timestamp: Date.now(),
      model: 'marengo',
    }];
  }
  
  if (rand < 0.15) {
    return [{
      id: uuid(),
      type: 'flashing',
      subtype: 'rapid_flashes',
      confidence: 0.8 + Math.random() * 0.15,
      timestamp: Date.now(),
      model: 'marengo',
    }];
  }

  return [];
}

function mockAudioAnalysis(): {
  detections: Detection[];
  emotionalState: EmotionalState;
} {
  const rand = Math.random();
  const detections: Detection[] = [];

  if (rand < 0.15) {
    detections.push({
      id: uuid(),
      type: 'profanity',
      subtype: 'mild',
      confidence: 0.7 + Math.random() * 0.25,
      timestamp: Date.now(),
      duration: 300 + Math.random() * 500,
      model: 'pegasus',
    });
  }

  const tensionLevel = 0.2 + Math.random() * 0.6;

  return {
    detections,
    emotionalState: {
      currentEmotion: tensionLevel > 0.6 ? 'frustrated' : tensionLevel > 0.4 ? 'excited' : 'calm',
      tensionLevel,
      predictedTrajectory: tensionLevel > 0.5 ? 'escalating' : 'stable',
      profanityRisk: tensionLevel > 0.7 ? 'high' : tensionLevel > 0.4 ? 'medium' : 'low',
      suggestedFilterAdjustment: 1 + (tensionLevel * 0.3),
    },
  };
}

function mockPIIAnalysis(): Detection[] {
  const rand = Math.random();
  
  if (rand < 0.05) {
    return [{
      id: uuid(),
      type: 'credit_card',
      confidence: 0.9 + Math.random() * 0.1,
      bbox: {
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 150,
        width: 200,
        height: 30,
      },
      timestamp: Date.now(),
      model: 'marengo',
    }];
  }

  if (rand < 0.1) {
    return [{
      id: uuid(),
      type: 'email',
      confidence: 0.85 + Math.random() * 0.1,
      bbox: {
        x: 50 + Math.random() * 150,
        y: 200 + Math.random() * 100,
        width: 180,
        height: 20,
      },
      timestamp: Date.now(),
      model: 'marengo',
    }];
  }

  return [];
}

function mockNearMissSearch(): Array<{
  type: PIIType;
  timestamp: number;
  description: string;
  thumbnailUrl?: string;
}> {
  return [
    {
      type: 'email',
      timestamp: 1234,
      description: 'Email address briefly visible in tab',
    },
    {
      type: 'address',
      timestamp: 5678,
      description: 'Delivery notification appeared momentarily',
    },
  ];
}

