import axios from 'axios';
import { trackModerationTriggered } from '../analytics/amplitude.js';

export class TwelveLabsService {
  constructor(analyticsClient) {
    this.analyticsClient = analyticsClient;
    // Read env vars lazily in constructor (after dotenv.config() has run)
    this.apiKey = process.env.TWELVE_LABS_API_KEY;
    const baseUrl = process.env.TWELVE_LABS_BASE_URL || 'https://api.twelvelabs.io/v1.2';
    
    if (!this.apiKey || this.apiKey === 'your_twelve_labs_api_key_here') {
      console.warn('⚠️  Twelve Labs API key not configured. Using mock mode.');
      this.mockMode = true;
    } else {
      this.mockMode = false;
      this.client = axios.create({
        baseURL: baseUrl,
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });
    }
  }

  /**
   * Analyze video frame using Marengo for visual PII detection
   * Detects: credit cards, IDs, addresses, phone numbers, etc.
   */
  async analyzeVideoFrame(frameData, streamId) {
    if (this.mockMode) {
      // Mock detection for development
      return this.mockVideoAnalysis();
    }

    try {
      // Convert frame data to base64 if needed
      const imageBase64 = typeof frameData === 'string' 
        ? frameData 
        : Buffer.from(frameData).toString('base64');

      // Call Marengo API for visual analysis
      const response = await this.client.post('/marengo/v1/search', {
        video_id: streamId,
        query: 'credit card, identification card, driver license, passport, address, phone number, social security',
        threshold: parseFloat(process.env.DEFAULT_BLUR_CONFIDENCE || '0.7'),
        frame_data: imageBase64
      });

      const detections = this.parseMarengoResponse(response.data);
      
      // Track moderation events
      detections.forEach(detection => {
        trackModerationTriggered(this.analyticsClient, {
          type: 'blur',
          confidence: detection.confidence,
          model: 'marengo',
          streamId,
          timestamp: Date.now()
        });
      });

      return detections;
    } catch (error) {
      console.error('Error analyzing video frame with Marengo:', error);
      // Return empty results on error to not block stream
      return [];
    }
  }

  /**
   * Analyze audio chunk using Pegasus for predictive violation detection
   * Uses semantic understanding, not just keyword matching
   */
  async analyzeAudioChunk(audioData, streamId, context = {}) {
    if (this.mockMode) {
      return this.mockAudioAnalysis(context);
    }

    try {
      const audioBase64 = typeof audioData === 'string'
        ? audioData
        : Buffer.from(audioData).toString('base64');

      // Use Pegasus for semantic audio analysis
      const response = await this.client.post('/pegasus/v1/search', {
        video_id: streamId,
        query: 'profanity, hate speech, threats, personal information disclosure, emotional tension rising',
        threshold: parseFloat(process.env.DEFAULT_BLEEP_CONFIDENCE || '0.8'),
        audio_data: audioBase64,
        context: {
          previous_tension: context.previousTension || 0,
          stream_duration: context.streamDuration || 0,
          ...context
        }
      });

      const detections = this.parsePegasusResponse(response.data, context);
      
      // Track moderation events
      detections.forEach(detection => {
        trackModerationTriggered(this.analyticsClient, {
          type: 'bleep',
          confidence: detection.confidence,
          model: 'pegasus',
          streamId,
          timestamp: Date.now()
        });
      });

      return detections;
    } catch (error) {
      console.error('Error analyzing audio with Pegasus:', error);
      return [];
    }
  }

  parseMarengoResponse(data) {
    // Parse Marengo API response into structured detections
    const detections = [];
    
    if (data.results && Array.isArray(data.results)) {
      data.results.forEach(result => {
        detections.push({
          type: 'visual_pii',
          category: result.category || 'unknown',
          confidence: result.score || result.confidence || 0,
          bbox: result.bbox || result.bounding_box,
          label: result.label || result.description,
          timestamp: result.timestamp || Date.now()
        });
      });
    }

    return detections;
  }

  parsePegasusResponse(data, context) {
    // Parse Pegasus API response for semantic audio analysis
    const detections = [];
    
    if (data.results && Array.isArray(data.results)) {
      data.results.forEach(result => {
        const tensionScore = result.emotional_tension || result.tension_score || 0;
        const baseConfidence = result.confidence || result.score || 0;
        
        // Adjust confidence based on emotional trajectory
        let adjustedConfidence = baseConfidence;
        if (context.previousTension && tensionScore > context.previousTension * 1.2) {
          // Rising tension = more aggressive filtering
          adjustedConfidence = Math.min(1.0, baseConfidence * 1.15);
        }

        detections.push({
          type: 'audio_violation',
          category: result.category || 'profanity',
          confidence: adjustedConfidence,
          tensionScore,
          startTime: result.start_time || 0,
          endTime: result.end_time || 0,
          text: result.transcript || result.text,
          reason: result.reason || 'contextual_analysis',
          timestamp: result.timestamp || Date.now()
        });
      });
    }

    return detections;
  }

  // Mock methods for development/testing
  mockVideoAnalysis() {
    // Simulate occasional PII detection
    if (Math.random() > 0.9) {
      return [{
        type: 'visual_pii',
        category: 'credit_card',
        confidence: 0.85,
        bbox: { x: 100, y: 200, width: 200, height: 120 },
        label: 'Credit Card',
        timestamp: Date.now()
      }];
    }
    return [];
  }

  mockAudioAnalysis(context) {
    const detections = [];
    const tensionScore = context.previousTension || 0;
    
    // Simulate predictive detection based on emotional trajectory
    if (tensionScore > 0.7 || Math.random() > 0.95) {
      detections.push({
        type: 'audio_violation',
        category: 'profanity',
        confidence: 0.75 + (tensionScore * 0.2),
        tensionScore: tensionScore + 0.1,
        startTime: 0,
        endTime: 2000,
        text: '[predicted violation]',
        reason: 'contextual_analysis',
        timestamp: Date.now()
      });
    }
    
    return detections;
  }
}
