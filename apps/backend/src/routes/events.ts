import { Router } from 'express';
import { z } from 'zod';
import { learningEngine } from '../services/learning-engine.js';
import { trackEvent } from '../services/amplitude.js';
import { AMPLITUDE_EVENTS, createFilterOverrideEvent } from '@sentinella/shared';
import type { FilterCategory, OverrideType } from '@sentinella/shared';

export const eventsRouter = Router();

const overrideSchema = z.object({
  filterId: z.string(),
  overrideType: z.enum(['reveal_once', 'reveal_always', 'reveal_hold']),
  category: z.enum([
    'profanity', 'violence', 'sexual', 'jumpscares',
    'flashing', 'spoilers', 'loud_audio', 'hate_speech'
  ]),
  subcategory: z.string().optional(),
  confidence: z.number(),
  timeToOverride: z.number(),
  sessionOverrideCount: z.number(),
  totalOverrideCount: z.number(),
});

const adjustmentResponseSchema = z.object({
  category: z.enum([
    'profanity', 'violence', 'sexual', 'jumpscares',
    'flashing', 'spoilers', 'loud_audio', 'hate_speech'
  ]),
  subcategory: z.string().optional(),
  accepted: z.boolean(),
  responseType: z.enum(['explicit_accept', 'explicit_reject', 'implicit_accept']),
  timeToRespond: z.number().nullable(),
});

// POST /api/v1/events/override
eventsRouter.post('/override', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const data = overrideSchema.parse(req.body);

    // Track in learning engine
    await learningEngine.recordOverride(
      userId,
      data.category as FilterCategory,
      data.subcategory,
      data.overrideType as OverrideType
    );

    // Track in Amplitude
    await trackEvent(
      userId,
      AMPLITUDE_EVENTS.FILTER_OVERRIDE,
      createFilterOverrideEvent(
        data.category as FilterCategory,
        data.subcategory,
        data.confidence,
        data.overrideType as OverrideType,
        data.timeToOverride,
        data.sessionOverrideCount,
        data.totalOverrideCount
      )
    );

    // Check if we should suggest an adjustment
    const adjustment = await learningEngine.checkForAdjustment(
      userId,
      data.category as FilterCategory,
      data.subcategory
    );

    res.json({
      success: true,
      suggestedAdjustment: adjustment,
    });
  } catch (error) {
    console.error('Override event error:', error);
    res.status(500).json({ error: 'Failed to process override' });
  }
});

// POST /api/v1/events/adjustment-response
eventsRouter.post('/adjustment-response', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const data = adjustmentResponseSchema.parse(req.body);

    // Process the response
    await learningEngine.processAdjustmentResponse(
      userId,
      data.category as FilterCategory,
      data.subcategory,
      data.accepted
    );

    // Track in Amplitude
    await trackEvent(
      userId,
      AMPLITUDE_EVENTS.SENSITIVITY_ADJUSTMENT_RESPONSE,
      {
        user_type: 'viewer',
        filter_category: data.category,
        adjustment_accepted: data.accepted,
        time_to_respond: data.timeToRespond,
        response_type: data.responseType,
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Adjustment response error:', error);
    res.status(500).json({ error: 'Failed to process adjustment response' });
  }
});

// POST /api/v1/events/session-start
eventsRouter.post('/session-start', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const { platform, profile, enabledFilters } = req.body;

    await trackEvent(
      userId,
      AMPLITUDE_EVENTS.SESSION_START,
      {
        user_type: 'viewer',
        platform,
        initial_profile: profile,
        filter_count_enabled: enabledFilters,
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Session start error:', error);
    res.status(500).json({ error: 'Failed to track session start' });
  }
});

// POST /api/v1/events/session-end
eventsRouter.post('/session-end', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const { 
      duration, 
      totalFiltered, 
      totalOverridden, 
      aiAdjustmentsAccepted,
      aiAdjustmentsRejected 
    } = req.body;

    await trackEvent(
      userId,
      AMPLITUDE_EVENTS.SESSION_END,
      {
        user_type: 'viewer',
        session_duration: duration,
        total_filtered: totalFiltered,
        total_overridden: totalOverridden,
        ai_adjustments_accepted: aiAdjustmentsAccepted,
        ai_adjustments_rejected: aiAdjustmentsRejected,
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Session end error:', error);
    res.status(500).json({ error: 'Failed to track session end' });
  }
});

