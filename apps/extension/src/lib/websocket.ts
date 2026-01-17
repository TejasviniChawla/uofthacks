// WebSocket client for real-time communication with backend

import { io, Socket } from 'socket.io-client';
import type { Detection, FilterInstruction, WSMessage } from '@shared/types';

const API_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

export class WebSocketClient {
  private socket: Socket | null = null;
  private userId: string;
  private streamId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(userId: string) {
    this.userId = userId;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(API_URL, {
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000
        });

        this.socket.on('connect', () => {
          console.log('✅ WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('disconnect', () => {
          console.log('❌ WebSocket disconnected');
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          this.reconnectAttempts++;
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinStream(streamId: string, platform: 'twitch' | 'youtube') {
    if (!this.socket) {
      throw new Error('WebSocket not connected');
    }

    this.streamId = streamId;
    this.socket.emit('join-stream', { streamId, platform, userId: this.userId });
  }

  leaveStream() {
    if (this.socket && this.streamId) {
      this.socket.emit('leave-stream', { streamId: this.streamId });
      this.streamId = null;
    }
  }

  sendFrameAnalysis(frame: string, timestamp: number) {
    if (!this.socket || !this.streamId) return;

    this.socket.emit('frame_analysis', {
      frame,
      timestamp,
      userId: this.userId,
      streamId: this.streamId
    });
  }

  sendAudioAnalysis(audio: string, timestamp: number) {
    if (!this.socket || !this.streamId) return;

    this.socket.emit('audio_analysis', {
      audio,
      timestamp,
      userId: this.userId,
      streamId: this.streamId
    });
  }

  onFilterInstruction(callback: (instruction: FilterInstruction) => void) {
    if (!this.socket) return;

    this.socket.on('filter_instruction', (data: FilterInstruction) => {
      callback(data);
    });
  }

  onWarning(callback: (warning: { category: string; countdown: number }) => void) {
    if (!this.socket) return;

    this.socket.on('content_warning', (data: { category: string; countdown: number }) => {
      callback(data);
    });
  }

  onError(callback: (error: string) => void) {
    if (!this.socket) return;

    this.socket.on('error', (error: string) => {
      callback(error);
    });
  }

  sendOverride(detectionId: string, overrideType: 'reveal_once' | 'reveal_always') {
    if (!this.socket || !this.streamId) return;

    this.socket.emit('filter_override', {
      detectionId,
      overrideType,
      userId: this.userId,
      streamId: this.streamId
    });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}
