import { TwelveLabsService } from './twelveLabs.js';

export class ModerationService {
  constructor(analyticsClient) {
    this.twelveLabs = new TwelveLabsService(analyticsClient);
    this.activeModerations = new Map(); // streamId -> Map<moderationId, moderationData>
  }

  /**
   * Process a video frame and detect PII
   */
  async processVideoFrame(frameData, streamId, timestamp) {
    const detections = await this.twelveLabs.analyzeVideoFrame(frameData, streamId);
    
    if (!this.activeModerations.has(streamId)) {
      this.activeModerations.set(streamId, new Map());
    }

    const moderations = [];
    detections.forEach((detection, index) => {
      const moderationId = `${streamId}-video-${timestamp}-${index}`;
      const moderation = {
        id: moderationId,
        type: 'blur',
        detection,
        timestamp,
        streamId,
        applied: false
      };
      
      this.activeModerations.get(streamId).set(moderationId, moderation);
      moderations.push(moderation);
    });

    return moderations;
  }

  /**
   * Process audio chunk and predict violations
   */
  async processAudioChunk(audioData, streamId, timestamp, context = {}) {
    const detections = await this.twelveLabs.analyzeAudioChunk(
      audioData,
      streamId,
      context
    );
    
    if (!this.activeModerations.has(streamId)) {
      this.activeModerations.set(streamId, new Map());
    }

    const moderations = [];
    detections.forEach((detection, index) => {
      const moderationId = `${streamId}-audio-${timestamp}-${index}`;
      const moderation = {
        id: moderationId,
        type: 'bleep',
        detection,
        timestamp,
        streamId,
        applied: false
      };
      
      this.activeModerations.get(streamId).set(moderationId, moderation);
      moderations.push(moderation);
    });

    return moderations;
  }

  /**
   * Get active moderation for a stream
   */
  getActiveModeration(streamId, moderationId) {
    const streamModerations = this.activeModerations.get(streamId);
    if (!streamModerations) return null;
    return streamModerations.get(moderationId) || null;
  }

  /**
   * Remove moderation (after override or expiry)
   */
  removeModeration(streamId, moderationId) {
    const streamModerations = this.activeModerations.get(streamId);
    if (streamModerations) {
      streamModerations.delete(moderationId);
    }
  }

  /**
   * Clear all moderations for a stream
   */
  clearStream(streamId) {
    this.activeModerations.delete(streamId);
  }

  /**
   * Update moderation thresholds (from adaptive learner)
   */
  updateThresholds(streamId, thresholds) {
    // This will be used by adaptive learner to adjust sensitivity
    // For now, we'll store it per stream
    if (!this.streamThresholds) {
      this.streamThresholds = new Map();
    }
    this.streamThresholds.set(streamId, thresholds);
  }

  getThresholds(streamId) {
    if (!this.streamThresholds) return null;
    return this.streamThresholds.get(streamId) || null;
  }
}
