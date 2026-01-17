import { trackRetentionSignal } from '../analytics/amplitude.js';

export class StreamProcessor {
  constructor(moderationService, adaptiveLearner, analyticsClient) {
    this.moderationService = moderationService;
    this.adaptiveLearner = adaptiveLearner;
    this.analyticsClient = analyticsClient;
    
    this.activeStreams = new Map(); // streamId -> stream data
    this.bufferQueue = new Map(); // streamId -> queue of buffered chunks
    this.safetyHistory = new Map(); // streamId -> array of safety events
    
    const bufferDelay = parseInt(process.env.BUFFER_DELAY_MS || '5000');
    this.bufferDelay = Math.max(
      parseInt(process.env.MIN_BUFFER_DELAY_MS || '3000'),
      Math.min(bufferDelay, parseInt(process.env.MAX_BUFFER_DELAY_MS || '10000'))
    );
  }

  /**
   * Start a new stream
   */
  async startStream(streamId, streamerId) {
    const streamData = {
      streamId,
      streamerId,
      startTime: Date.now(),
      viewers: new Set(),
      isActive: true,
      audioContext: {
        previousTension: 0,
        chunkCount: 0
      }
    };

    this.activeStreams.set(streamId, streamData);
    this.bufferQueue.set(streamId, []);
    this.safetyHistory.set(streamId, []);

    console.log(`📹 Stream started: ${streamId}`);
    return streamData;
  }

  /**
   * Stop a stream
   */
  async stopStream(streamId) {
    const streamData = this.activeStreams.get(streamId);
    if (streamData) {
      streamData.isActive = false;
      
      // Clear buffers and history
      this.bufferQueue.delete(streamId);
      this.moderationService.clearStream(streamId);
      this.adaptiveLearner.clearStream(streamId);
      
      console.log(`📹 Stream stopped: ${streamId}`);
    }
  }

  /**
   * Add a viewer to the stream
   */
  async addViewer(streamId, socketId) {
    const streamData = this.activeStreams.get(streamId);
    if (streamData) {
      streamData.viewers.add(socketId);
      
      // Track retention signal
      this.trackRetention(streamId);
    }
  }

  /**
   * Remove a viewer from the stream
   */
  async removeViewer(streamId, socketId) {
    const streamData = this.activeStreams.get(streamId);
    if (streamData) {
      streamData.viewers.delete(socketId);
    }
  }

  /**
   * Process incoming stream chunk (before buffer)
   */
  async processStreamChunk(streamId, chunk, socketId) {
    const streamData = this.activeStreams.get(streamId);
    if (!streamData || !streamData.isActive) {
      return;
    }

    const timestamp = chunk.timestamp || Date.now();
    const bufferedChunk = {
      ...chunk,
      timestamp,
      receivedAt: Date.now()
    };

    // Add to buffer queue
    if (!this.bufferQueue.has(streamId)) {
      this.bufferQueue.set(streamId, []);
    }
    this.bufferQueue.get(streamId).push(bufferedChunk);

    // Process in parallel
    const promises = [];

    // Analyze video frame if present
    if (chunk.videoFrame) {
      promises.push(
        this.moderationService.processVideoFrame(
          chunk.videoFrame,
          streamId,
          timestamp
        )
      );
    }

    // Analyze audio chunk if present
    if (chunk.audioChunk) {
      const audioContext = {
        previousTension: streamData.audioContext.previousTension,
        streamDuration: timestamp - streamData.startTime,
        chunkCount: streamData.audioContext.chunkCount
      };

      promises.push(
        this.moderationService.processAudioChunk(
          chunk.audioChunk,
          streamId,
          timestamp,
          audioContext
        ).then(moderations => {
          // Update tension for next chunk
          if (moderations.length > 0) {
            const maxTension = Math.max(
              ...moderations.map(m => m.detection?.tensionScore || 0)
            );
            streamData.audioContext.previousTension = maxTension;
          }
          streamData.audioContext.chunkCount++;
          return moderations;
        })
      );
    }

    // Wait for analysis and apply moderations to buffered chunk
    const results = await Promise.all(promises);
    const allModerations = results.flat();

    // Attach moderations to buffered chunk
    bufferedChunk.moderations = allModerations;

    // Record in safety history
    if (allModerations.length > 0) {
      const history = this.safetyHistory.get(streamId);
      history.push({
        timestamp,
        moderations: allModerations,
        chunk
      });
    }

    // Schedule release from buffer
    const delay = this.bufferDelay;
    setTimeout(() => {
      this.releaseFromBuffer(streamId, bufferedChunk);
    }, delay);
  }

  /**
   * Release chunk from buffer after delay
   */
  async releaseFromBuffer(streamId, chunk) {
    const streamData = this.activeStreams.get(streamId);
    if (!streamData || !streamData.isActive) {
      return;
    }

    // Apply moderations based on current sensitivity settings
    const settings = this.adaptiveLearner.getSensitivitySettings(streamId);
    const filteredModerations = this.filterModerationsBySensitivity(
      chunk.moderations || [],
      settings
    );

    // Emit to viewers via WebSocket (will be handled by main server)
    return {
      chunk,
      moderations: filteredModerations,
      streamId
    };
  }

  /**
   * Filter moderations based on current sensitivity settings
   */
  filterModerationsBySensitivity(moderations, settings) {
    return moderations.filter(moderation => {
      const category = moderation.detection?.category || moderation.type;
      const threshold = settings[category]?.threshold || 
                       this.adaptiveLearner.getDefaultThreshold(category);
      const confidence = moderation.detection?.confidence || 0;
      
      return confidence >= threshold;
    });
  }

  /**
   * Track retention signal
   */
  trackRetention(streamId) {
    const streamData = this.activeStreams.get(streamId);
    if (streamData) {
      trackRetentionSignal(this.analyticsClient, {
        viewerCount: streamData.viewers.size,
        chatVelocity: 0, // Would be calculated from chat messages
        streamId,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Safety search - find near-miss moments in stream history
   */
  async safetySearch(streamId, options = {}) {
    const history = this.safetyHistory.get(streamId) || [];
    const { startTime, endTime, types } = options;

    let results = history.filter(event => {
      if (startTime && event.timestamp < startTime) return false;
      if (endTime && event.timestamp > endTime) return false;
      if (types && types.length > 0) {
        return event.moderations.some(m => types.includes(m.type));
      }
      return true;
    });

    // Sort by timestamp
    results.sort((a, b) => a.timestamp - b.timestamp);

    return results.map(event => ({
      timestamp: event.timestamp,
      moderations: event.moderations,
      riskLevel: this.calculateRiskLevel(event.moderations)
    }));
  }

  /**
   * Calculate risk level for a set of moderations
   */
  calculateRiskLevel(moderations) {
    if (moderations.length === 0) return 'none';
    
    const avgConfidence = moderations.reduce((sum, m) => 
      sum + (m.detection?.confidence || 0), 0
    ) / moderations.length;

    if (avgConfidence > 0.9) return 'high';
    if (avgConfidence > 0.7) return 'medium';
    return 'low';
  }
}
