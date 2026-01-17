import { WebSocket } from 'ws';
import { v4 as uuid } from 'uuid';
import { analyzeFrame, analyzeAudio } from '../services/twelve-labs.js';
import { filterEngine } from '../services/filter-engine.js';
import { learningEngine } from '../services/learning-engine.js';
import { trackEvent } from '../services/amplitude.js';
import { AMPLITUDE_EVENTS } from '@sentinella/shared';
import type { WSMessage, FilterCategory, OverrideType } from '@sentinella/shared';

interface ClientState {
  userId: string;
  sessionId: string;
  platform: 'twitch' | 'youtube' | null;
  streamStartTime: number;
  lastFrameTime: number;
  filterTriggersThisSession: number;
  overridesThisSession: number;
}

const clients = new Map<WebSocket, ClientState>();

export function handleWebSocketConnection(ws: WebSocket) {
  console.log('New WebSocket connection');

  // Initialize client state
  const clientState: ClientState = {
    userId: '',
    sessionId: uuid(),
    platform: null,
    streamStartTime: Date.now(),
    lastFrameTime: 0,
    filterTriggersThisSession: 0,
    overridesThisSession: 0,
  };
  clients.set(ws, clientState);

  ws.on('message', async (data) => {
    try {
      const message: WSMessage = JSON.parse(data.toString());
      await handleMessage(ws, message, clientState);
    } catch (error) {
      console.error('WebSocket message error:', error);
      sendError(ws, 'Invalid message format');
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
    handleDisconnect(clientState);
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
}

async function handleMessage(
  ws: WebSocket, 
  message: WSMessage, 
  state: ClientState
): Promise<void> {
  switch (message.type) {
    case 'frame_analysis':
      await handleFrameAnalysis(ws, message.payload, state);
      break;

    case 'audio_analysis':
      await handleAudioAnalysis(ws, message.payload, state);
      break;

    case 'override':
      await handleOverride(ws, message.payload, state);
      break;

    case 'preference_update':
      await handlePreferenceUpdate(ws, message.payload, state);
      break;

    case 'session_stats':
      await handleSessionStats(ws, state);
      break;

    default:
      console.log('Unknown message type:', message.type);
  }
}

async function handleFrameAnalysis(
  ws: WebSocket,
  payload: any,
  state: ClientState
): Promise<void> {
  const startTime = Date.now();

  // Update state
  if (payload.userId) state.userId = payload.userId;
  if (payload.platform) state.platform = payload.platform;
  state.lastFrameTime = payload.timestamp;

  // Analyze frame
  const detections = await analyzeFrame(payload.frame);

  // Generate filter instructions
  const filterInstructions = await filterEngine.generateInstructions(
    state.userId,
    detections,
    payload.timestamp
  );

  // Track filter triggers
  if (filterInstructions.length > 0) {
    state.filterTriggersThisSession += filterInstructions.length;
  }

  const processingTime = Date.now() - startTime;

  // Send response
  send(ws, {
    type: 'filter_instruction',
    payload: {
      instructions: filterInstructions,
      detections,
      bufferPosition: payload.timestamp,
      processingTime,
    },
    timestamp: Date.now(),
    messageId: uuid(),
  });
}

async function handleAudioAnalysis(
  ws: WebSocket,
  payload: any,
  state: ClientState
): Promise<void> {
  const startTime = Date.now();

  if (payload.userId) state.userId = payload.userId;

  // Analyze audio
  const { detections, emotionalState } = await analyzeAudio(payload.audio);

  // Generate filter instructions
  const filterInstructions = await filterEngine.generateInstructions(
    state.userId,
    detections,
    payload.timestamp
  );

  // Track
  if (filterInstructions.length > 0) {
    state.filterTriggersThisSession += filterInstructions.length;
  }

  const processingTime = Date.now() - startTime;

  // Send response
  send(ws, {
    type: 'filter_instruction',
    payload: {
      instructions: filterInstructions,
      detections,
      emotionalState,
      bufferPosition: payload.timestamp,
      processingTime,
    },
    timestamp: Date.now(),
    messageId: uuid(),
  });

  // If emotional state indicates high tension, send adjustment notification
  if (emotionalState && emotionalState.tensionLevel > 0.7) {
    send(ws, {
      type: 'ai_adjustment',
      payload: {
        category: 'profanity' as FilterCategory,
        reason: 'High tension detected - temporarily increasing profanity sensitivity',
        temporary: true,
        adjustment: emotionalState.suggestedFilterAdjustment,
      },
      timestamp: Date.now(),
      messageId: uuid(),
    });
  }
}

async function handleOverride(
  ws: WebSocket,
  payload: any,
  state: ClientState
): Promise<void> {
  state.overridesThisSession++;

  // Record override
  await learningEngine.recordOverride(
    state.userId,
    payload.category as FilterCategory,
    payload.subcategory,
    payload.overrideType as OverrideType
  );

  // Track in Amplitude
  await trackEvent(state.userId, AMPLITUDE_EVENTS.FILTER_OVERRIDE, {
    user_type: 'viewer',
    filter_category: payload.category,
    filter_subcategory: payload.subcategory,
    override_type: payload.overrideType,
    session_override_count: state.overridesThisSession,
  });

  // Check if we should suggest an adjustment
  const adjustment = await learningEngine.checkForAdjustment(
    state.userId,
    payload.category as FilterCategory,
    payload.subcategory
  );

  if (adjustment?.shouldAdjust) {
    send(ws, {
      type: 'ai_adjustment',
      payload: {
        category: payload.category,
        subcategory: payload.subcategory,
        oldThreshold: 0.5, // Would come from actual config
        newThreshold: adjustment.suggestedThreshold,
        confidence: adjustment.confidence,
        reason: adjustment.reason,
      },
      timestamp: Date.now(),
      messageId: uuid(),
    });
  }
}

async function handlePreferenceUpdate(
  ws: WebSocket,
  payload: any,
  state: ClientState
): Promise<void> {
  // Acknowledge preference update
  send(ws, {
    type: 'preference_update',
    payload: {
      success: true,
      appliedAt: Date.now(),
    },
    timestamp: Date.now(),
    messageId: uuid(),
  });
}

async function handleSessionStats(
  ws: WebSocket,
  state: ClientState
): Promise<void> {
  const learningStatus = await learningEngine.getLearningStatus(state.userId);

  send(ws, {
    type: 'session_stats',
    payload: {
      sessionDuration: Date.now() - state.streamStartTime,
      filterTriggers: state.filterTriggersThisSession,
      overrides: state.overridesThisSession,
      learningStatus,
    },
    timestamp: Date.now(),
    messageId: uuid(),
  });
}

function handleDisconnect(state: ClientState): void {
  if (state.userId) {
    // Track session end
    trackEvent(state.userId, AMPLITUDE_EVENTS.SESSION_END, {
      user_type: 'viewer',
      session_duration: Date.now() - state.streamStartTime,
      total_filtered: state.filterTriggersThisSession,
      total_overridden: state.overridesThisSession,
    }).catch(console.error);
  }
}

function send(ws: WebSocket, message: WSMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function sendError(ws: WebSocket, error: string): void {
  send(ws, {
    type: 'error',
    payload: { error },
    timestamp: Date.now(),
    messageId: uuid(),
  });
}

