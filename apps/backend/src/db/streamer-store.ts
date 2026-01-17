import type { Detection, PIIType } from '@sentinella/shared';
import { v4 as uuid } from 'uuid';

interface WhitelistEntry {
  id: string;
  userId: string;
  piiType: PIIType;
  valueHash: string;
  description: string;
  createdAt: Date;
}

interface DetectionLog {
  id: string;
  userId: string;
  streamId?: string;
  type: PIIType | string;
  confidence: number;
  autoBlurred: boolean;
  wasWhitelisted: boolean;
  timestamp: number;
}

interface StreamStatus {
  isLive: boolean;
  startedAt: number | null;
  totalDetections: number;
  currentTensionLevel: number;
}

interface StreamerState {
  whitelist: WhitelistEntry[];
  detections: DetectionLog[];
  status: StreamStatus;
}

class StreamerStore {
  private streamers: Map<string, StreamerState> = new Map();

  /**
   * Get or create streamer state
   */
  private getOrCreateStreamer(userId: string): StreamerState {
    if (!this.streamers.has(userId)) {
      this.streamers.set(userId, {
        whitelist: [],
        detections: [],
        status: {
          isLive: false,
          startedAt: null,
          totalDetections: 0,
          currentTensionLevel: 0.3,
        },
      });
    }
    return this.streamers.get(userId)!;
  }

  // ==================== STREAM STATUS ====================

  /**
   * Get current stream status
   */
  async getStreamStatus(userId: string): Promise<StreamStatus> {
    const streamer = this.getOrCreateStreamer(userId);
    return streamer.status;
  }

  /**
   * Update stream status
   */
  async updateStreamStatus(
    userId: string,
    updates: Partial<StreamStatus>
  ): Promise<StreamStatus> {
    const streamer = this.getOrCreateStreamer(userId);
    streamer.status = { ...streamer.status, ...updates };
    return streamer.status;
  }

  /**
   * Start a stream
   */
  async startStream(userId: string): Promise<StreamStatus> {
    return this.updateStreamStatus(userId, {
      isLive: true,
      startedAt: Date.now(),
      totalDetections: 0,
    });
  }

  /**
   * End a stream
   */
  async endStream(userId: string): Promise<StreamStatus> {
    return this.updateStreamStatus(userId, {
      isLive: false,
    });
  }

  // ==================== WHITELIST ====================

  /**
   * Get whitelist for a streamer
   */
  async getWhitelist(userId: string): Promise<WhitelistEntry[]> {
    const streamer = this.getOrCreateStreamer(userId);
    return streamer.whitelist;
  }

  /**
   * Add item to whitelist
   */
  async addToWhitelist(
    userId: string,
    data: {
      piiType: PIIType;
      value: string;
      description: string;
    }
  ): Promise<WhitelistEntry> {
    const streamer = this.getOrCreateStreamer(userId);

    const entry: WhitelistEntry = {
      id: uuid(),
      userId,
      piiType: data.piiType,
      valueHash: this.hashValue(data.value),
      description: data.description,
      createdAt: new Date(),
    };

    streamer.whitelist.push(entry);
    return entry;
  }

  /**
   * Remove item from whitelist
   */
  async removeFromWhitelist(userId: string, entryId: string): Promise<boolean> {
    const streamer = this.getOrCreateStreamer(userId);
    const index = streamer.whitelist.findIndex(w => w.id === entryId);

    if (index === -1) {
      return false;
    }

    streamer.whitelist.splice(index, 1);
    return true;
  }

  // ==================== DETECTIONS ====================

  /**
   * Record PII detections
   */
  async recordDetections(
    userId: string,
    detections: Detection[],
    timestamp: number,
    streamId?: string
  ): Promise<void> {
    const streamer = this.getOrCreateStreamer(userId);
    const whitelist = streamer.whitelist;

    for (const detection of detections) {
      const wasWhitelisted = false; // Would check against actual detected values

      streamer.detections.push({
        id: uuid(),
        userId,
        streamId,
        type: detection.type,
        confidence: detection.confidence,
        autoBlurred: true,
        wasWhitelisted,
        timestamp,
      });

      streamer.status.totalDetections++;
    }

    // Keep only last 1000 detections per streamer
    if (streamer.detections.length > 1000) {
      streamer.detections = streamer.detections.slice(-1000);
    }
  }

  /**
   * Get detections for a specific stream
   */
  async getStreamDetections(
    userId: string,
    streamId: string
  ): Promise<DetectionLog[]> {
    const streamer = this.getOrCreateStreamer(userId);
    return streamer.detections.filter(d => d.streamId === streamId);
  }

  /**
   * Get recent detections
   */
  async getRecentDetections(userId: string, limit: number = 10): Promise<DetectionLog[]> {
    const streamer = this.getOrCreateStreamer(userId);
    return streamer.detections.slice(-limit).reverse();
  }

  /**
   * Get detection statistics
   */
  async getDetectionStats(userId: string): Promise<{
    totalDetections: number;
    byType: Record<string, number>;
    last24Hours: number;
    last7Days: number;
  }> {
    const streamer = this.getOrCreateStreamer(userId);
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const week = 7 * day;

    const byType: Record<string, number> = {};
    let last24Hours = 0;
    let last7Days = 0;

    for (const detection of streamer.detections) {
      byType[detection.type] = (byType[detection.type] || 0) + 1;

      if (now - detection.timestamp < day) {
        last24Hours++;
      }
      if (now - detection.timestamp < week) {
        last7Days++;
      }
    }

    return {
      totalDetections: streamer.detections.length,
      byType,
      last24Hours,
      last7Days,
    };
  }

  // ==================== HELPERS ====================

  /**
   * Hash a value for whitelist comparison
   */
  private hashValue(value: string): string {
    // Simple hash for demo - use proper hashing in production
    let hash = 0;
    const normalized = value.toLowerCase().replace(/\s+/g, '');
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Update tension level
   */
  async updateTensionLevel(userId: string, tensionLevel: number): Promise<void> {
    const streamer = this.getOrCreateStreamer(userId);
    streamer.status.currentTensionLevel = tensionLevel;
  }
}

export const streamerStore = new StreamerStore();

