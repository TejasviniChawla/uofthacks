import { Router } from 'express';
import { z } from 'zod';
import { analyzeFrame, analyzeAudio } from '../services/twelve-labs.js';
import { filterEngine } from '../services/filter-engine.js';
import { trackEvent } from '../services/amplitude.js';
import { AMPLITUDE_EVENTS, createFilterTriggeredEvent } from '@sentinella/shared';
import type { FrameAnalysisRequest, AudioAnalysisRequest, Detection } from '@sentinella/shared';

export const analyzeRouter = Router();

const frameRequestSchema = z.object({
  frame: z.string(), // base64
  timestamp: z.number(),
  userId: z.string(),
  streamId: z.string().optional(),
  platform: z.enum(['twitch', 'youtube']).optional(),
});

const audioRequestSchema = z.object({
  audio: z.string(), // base64
  timestamp: z.number(),
  userId: z.string(),
  streamId: z.string().optional(),
});

// POST /api/v1/analyze/frame
analyzeRouter.post('/frame', async (req, res) => {
  const startTime = Date.now();

  try {
    const data = frameRequestSchema.parse(req.body) as FrameAnalysisRequest;
    
    // Analyze frame with Twelve Labs Marengo
    const detections = await analyzeFrame(data.frame);
    
    // Get user preferences and generate filter instructions
    const filterInstructions = await filterEngine.generateInstructions(
      data.userId,
      detections,
      data.timestamp
    );

    const processingTime = Date.now() - startTime;

    // Track filter events
    for (const detection of detections) {
      if (detection.confidence > 0.5) {
        await trackEvent(
          data.userId,
          AMPLITUDE_EVENTS.FILTER_TRIGGERED,
          createFilterTriggeredEvent(
            detection.type as any,
            detection.subtype,
            detection.confidence,
            detection.model,
            data.platform || 'twitch',
            data.timestamp,
            5000 - processingTime
          )
        );
      }
    }

    res.json({
      detections,
      filterInstructions,
      processingTime,
    });
  } catch (error) {
    console.error('Frame analysis error:', error);
    res.status(500).json({ 
      error: 'Frame analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/v1/analyze/audio
analyzeRouter.post('/audio', async (req, res) => {
  const startTime = Date.now();

  try {
    const data = audioRequestSchema.parse(req.body) as AudioAnalysisRequest;
    
    // Analyze audio with Twelve Labs Pegasus
    const { detections, emotionalState } = await analyzeAudio(data.audio);
    
    // Get user preferences and generate filter instructions
    const filterInstructions = await filterEngine.generateInstructions(
      data.userId,
      detections,
      data.timestamp
    );

    const processingTime = Date.now() - startTime;

    res.json({
      detections,
      emotionalState,
      filterInstructions,
      processingTime,
    });
  } catch (error) {
    console.error('Audio analysis error:', error);
    res.status(500).json({ 
      error: 'Audio analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/v1/analyze/combined (for efficiency)
analyzeRouter.post('/combined', async (req, res) => {
  const startTime = Date.now();

  try {
    const { frame, audio, timestamp, userId, platform } = req.body;
    
    const results: {
      frameDetections: Detection[];
      audioDetections: Detection[];
      emotionalState: any;
      filterInstructions: any[];
    } = {
      frameDetections: [],
      audioDetections: [],
      emotionalState: null,
      filterInstructions: [],
    };

    // Run analyses in parallel
    const [frameResult, audioResult] = await Promise.all([
      frame ? analyzeFrame(frame) : Promise.resolve([]),
      audio ? analyzeAudio(audio) : Promise.resolve({ detections: [], emotionalState: null }),
    ]);

    results.frameDetections = frameResult;
    results.audioDetections = audioResult.detections;
    results.emotionalState = audioResult.emotionalState;

    // Combine detections and generate filter instructions
    const allDetections = [...results.frameDetections, ...results.audioDetections];
    results.filterInstructions = await filterEngine.generateInstructions(
      userId,
      allDetections,
      timestamp
    );

    const processingTime = Date.now() - startTime;

    res.json({
      ...results,
      processingTime,
    });
  } catch (error) {
    console.error('Combined analysis error:', error);
    res.status(500).json({ 
      error: 'Combined analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

