import { Router } from 'express';
import { z } from 'zod';
import { userPreferencesStore } from '../db/preferences-store.js';
import { learningEngine } from '../services/learning-engine.js';

export const preferencesRouter = Router();

const filterConfigSchema = z.object({
  category: z.enum([
    'profanity', 'violence', 'sexual', 'jumpscares', 
    'flashing', 'spoilers', 'loud_audio', 'hate_speech'
  ]),
  level: z.enum(['off', 'low', 'medium', 'high', 'maximum']),
  threshold: z.number().min(0).max(1),
  visualFilter: z.enum(['blur', 'black_box', 'pixelate', 'dim']),
  audioFilter: z.enum(['bleep', 'silence', 'muffle', 'normalize']),
  subcategories: z.record(z.object({
    enabled: z.boolean(),
    threshold: z.number().min(0).max(1),
  })).optional(),
});

const preferencesSchema = z.object({
  profileName: z.string(),
  isDefault: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  lockPin: z.string().optional(),
  filters: z.array(filterConfigSchema),
});

// GET /api/v1/preferences
preferencesRouter.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const preferences = await userPreferencesStore.getPreferences(userId);
    const learnedPreferences = await learningEngine.getLearnedPreferences(userId);

    res.json({
      profiles: preferences,
      learnedPreferences,
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// GET /api/v1/preferences/:profileId
preferencesRouter.get('/:profileId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const profile = await userPreferencesStore.getProfile(userId, req.params.profileId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// POST /api/v1/preferences
preferencesRouter.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const data = preferencesSchema.parse(req.body);
    const profile = await userPreferencesStore.createProfile(userId, data);

    res.status(201).json(profile);
  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

// PUT /api/v1/preferences/:profileId
preferencesRouter.put('/:profileId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const data = preferencesSchema.partial().parse(req.body);
    const profile = await userPreferencesStore.updateProfile(
      userId, 
      req.params.profileId, 
      data
    );

    res.json(profile);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// DELETE /api/v1/preferences/:profileId
preferencesRouter.delete('/:profileId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    await userPreferencesStore.deleteProfile(userId, req.params.profileId);
    res.status(204).send();
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ error: 'Failed to delete profile' });
  }
});

// POST /api/v1/preferences/switch-profile
preferencesRouter.post('/switch-profile', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const { profileId } = req.body;
    await userPreferencesStore.setActiveProfile(userId, profileId);

    const profile = await userPreferencesStore.getProfile(userId, profileId);
    res.json(profile);
  } catch (error) {
    console.error('Switch profile error:', error);
    res.status(500).json({ error: 'Failed to switch profile' });
  }
});

