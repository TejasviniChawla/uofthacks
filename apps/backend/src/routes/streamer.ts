import { Router } from 'express';
import { z } from 'zod';
import { analyzeFrameForPII, searchStreamForNearMisses } from '../services/twelve-labs.js';
import { trackEvent } from '../services/amplitude.js';
import { AMPLITUDE_EVENTS, createPIIDetectedEvent } from '@sentinella/shared';
import { streamerStore } from '../db/streamer-store.js';
import type { PIIType } from '@sentinella/shared';

export const streamerRouter = Router();

const whitelistSchema = z.object({
  piiType: z.enum([
    'credit_card', 'address', 'phone_number', 'email',
    'government_id', 'personal_name', 'login_credentials'
  ]),
  value: z.string(),
  description: z.string(),
});

// GET /api/v1/streamer/status
streamerRouter.get('/status', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const status = await streamerStore.getStreamStatus(userId);
    res.json(status);
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// POST /api/v1/streamer/analyze-frame
streamerRouter.post('/analyze-frame', async (req, res) => {
  const startTime = Date.now();

  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const { frame, timestamp } = req.body;
    
    // Get whitelist
    const whitelist = await streamerStore.getWhitelist(userId);
    
    // Analyze frame for PII
    const piiDetections = await analyzeFrameForPII(frame, whitelist);
    
    // Track detections
    for (const detection of piiDetections) {
      await trackEvent(
        userId,
        AMPLITUDE_EVENTS.PII_DETECTED,
        createPIIDetectedEvent(
          detection.type as PIIType,
          detection.confidence,
          true,
          0.2 // Approximate time visible before blur
        )
      );
    }

    // Record in detection log
    await streamerStore.recordDetections(userId, piiDetections, timestamp);

    const processingTime = Date.now() - startTime;

    res.json({
      detections: piiDetections,
      processingTime,
    });
  } catch (error) {
    console.error('Streamer frame analysis error:', error);
    res.status(500).json({ error: 'Frame analysis failed' });
  }
});

// GET /api/v1/streamer/whitelist
streamerRouter.get('/whitelist', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const whitelist = await streamerStore.getWhitelist(userId);
    res.json(whitelist);
  } catch (error) {
    console.error('Get whitelist error:', error);
    res.status(500).json({ error: 'Failed to get whitelist' });
  }
});

// POST /api/v1/streamer/whitelist
streamerRouter.post('/whitelist', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const data = whitelistSchema.parse(req.body);
    const entry = await streamerStore.addToWhitelist(userId, data);

    // Track event
    await trackEvent(
      userId,
      AMPLITUDE_EVENTS.PII_WHITELISTED,
      {
        user_type: 'streamer',
        pii_type: data.piiType,
        specific_value_hash: entry.valueHash,
        reason: data.description,
      }
    );

    res.status(201).json(entry);
  } catch (error) {
    console.error('Add to whitelist error:', error);
    res.status(500).json({ error: 'Failed to add to whitelist' });
  }
});

// DELETE /api/v1/streamer/whitelist/:id
streamerRouter.delete('/whitelist/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    await streamerStore.removeFromWhitelist(userId, req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Remove from whitelist error:', error);
    res.status(500).json({ error: 'Failed to remove from whitelist' });
  }
});

// GET /api/v1/streamer/report/:streamId
streamerRouter.get('/report/:streamId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    // Search for near-misses using Twelve Labs
    const nearMisses = await searchStreamForNearMisses(req.params.streamId);

    // Get detection log for this stream
    const detections = await streamerStore.getStreamDetections(
      userId, 
      req.params.streamId
    );

    res.json({
      streamId: req.params.streamId,
      totalPIIDetected: detections.length,
      piiDetections: detections,
      nearMisses,
      recommendations: generateRecommendations(detections, nearMisses),
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /api/v1/streamer/recent-detections
streamerRouter.get('/recent-detections', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const detections = await streamerStore.getRecentDetections(userId, limit);
    res.json(detections);
  } catch (error) {
    console.error('Get recent detections error:', error);
    res.status(500).json({ error: 'Failed to get recent detections' });
  }
});

function generateRecommendations(detections: any[], nearMisses: any[]): string[] {
  const recommendations: string[] = [];

  if (detections.some(d => d.type === 'credit_card')) {
    recommendations.push('Consider using a dedicated browser profile for streaming with no saved payment info.');
  }

  if (detections.some(d => d.type === 'address')) {
    recommendations.push('Check for visible mail or packages before going live.');
  }

  if (nearMisses.length > 3) {
    recommendations.push('You had several near-misses this stream. Consider reviewing your desk/screen setup.');
  }

  if (detections.length === 0 && nearMisses.length === 0) {
    recommendations.push('Great stream! No PII issues detected.');
  }

  return recommendations;
}

