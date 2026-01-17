import { WS_URL } from './constants';
import { v4 as uuid } from './uuid';
import type { WSMessage, FilterInstruction, Detection, AIAdjustment } from '../types';

type MessageHandler = (message: WSMessage) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Set<MessageHandler> = new Set();
  private userId: string = '';
  private platform: 'twitch' | 'youtube' | null = null;

  /**
   * Connect to the WebSocket server
   */
  connect(userId: string, platform: 'twitch' | 'youtube'): void {
    this.userId = userId;
    this.platform = platform;

    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log('[Sentinella] WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          this.notifyHandlers(message);
        } catch (error) {
          console.error('[Sentinella] Failed to parse message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('[Sentinella] WebSocket closed');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[Sentinella] WebSocket error:', error);
      };
    } catch (error) {
      console.error('[Sentinella] Failed to connect:', error);
      this.attemptReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Send a frame for analysis
   */
  sendFrame(frame: string, timestamp: number): void {
    this.send({
      type: 'frame_analysis',
      payload: {
        frame,
        timestamp,
        userId: this.userId,
        platform: this.platform,
      },
      timestamp: Date.now(),
      messageId: uuid(),
    });
  }

  /**
   * Send audio for analysis
   */
  sendAudio(audio: string, timestamp: number): void {
    this.send({
      type: 'audio_analysis',
      payload: {
        audio,
        timestamp,
        userId: this.userId,
      },
      timestamp: Date.now(),
      messageId: uuid(),
    });
  }

  /**
   * Send an override event
   */
  sendOverride(
    category: string,
    subcategory: string | undefined,
    overrideType: 'reveal_once' | 'reveal_always' | 'reveal_hold'
  ): void {
    this.send({
      type: 'override',
      payload: {
        category,
        subcategory,
        overrideType,
      },
      timestamp: Date.now(),
      messageId: uuid(),
    });
  }

  /**
   * Request session stats
   */
  requestStats(): void {
    this.send({
      type: 'session_stats',
      payload: {},
      timestamp: Date.now(),
      messageId: uuid(),
    });
  }

  /**
   * Subscribe to messages
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private send(message: WSMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[Sentinella] WebSocket not connected, message dropped');
    }
  }

  private notifyHandlers(message: WSMessage): void {
    for (const handler of this.messageHandlers) {
      try {
        handler(message);
      } catch (error) {
        console.error('[Sentinella] Handler error:', error);
      }
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Sentinella] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[Sentinella] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.userId && this.platform) {
        this.connect(this.userId, this.platform);
      }
    }, delay);
  }
}

export const wsClient = new WebSocketClient();
