// Main Content Script - Orchestrates video interception, buffering, and filtering

import { VideoInterceptor } from './video-interceptor';
import { BufferManager } from './buffer-manager';
import { FilterApplier } from './filter-applier';
import { OverlayManager } from './overlay-manager';
import { WebSocketClient } from '../lib/websocket';
import { trackFilterTriggered, trackFilterOverride } from '../lib/amplitude';
import type { FilterInstruction, Detection } from '@shared/types';

// Detect platform
function detectPlatform(): 'twitch' | 'youtube' | null {
  const hostname = window.location.hostname;
  if (hostname.includes('twitch.tv')) return 'twitch';
  if (hostname.includes('youtube.com')) return 'youtube';
  return null;
}

// Find video element
function findVideoElement(): HTMLVideoElement | null {
  // Try Twitch selector
  const twitchVideo = document.querySelector('video[data-a-target="player-video"]') as HTMLVideoElement;
  if (twitchVideo) return twitchVideo;

  // Try YouTube selector
  const youtubeVideo = document.querySelector('video.html5-main-video') as HTMLVideoElement;
  if (youtubeVideo) return youtubeVideo;

  // Fallback: find any video element
  return document.querySelector('video') as HTMLVideoElement;
}

class SentinellaContentScript {
  private videoInterceptor: VideoInterceptor;
  private bufferManager: BufferManager;
  private filterApplier: FilterApplier | null = null;
  private overlayManager: OverlayManager | null = null;
  private wsClient: WebSocketClient | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private platform: 'twitch' | 'youtube' | null = null;
  private isActive: boolean = false;
  private sessionStats = {
    itemsFiltered: 0,
    itemsByCategory: {} as Record<string, number>,
    itemsRevealed: 0,
    overrides: 0
  };

  constructor() {
    this.videoInterceptor = new VideoInterceptor();
    this.bufferManager = new BufferManager(5000); // 5 second buffer
    this.platform = detectPlatform();
  }

  async initialize() {
    if (!this.platform) {
      console.log('Sentinella: Platform not supported');
      return;
    }

    // Find video element
    this.videoElement = findVideoElement();
    if (!this.videoElement) {
      // Wait for video to load
      const observer = new MutationObserver(() => {
        this.videoElement = findVideoElement();
        if (this.videoElement) {
          observer.disconnect();
          this.setupVideo();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      return;
    }

    this.setupVideo();
  }

  private setupVideo() {
    if (!this.videoElement) return;

    // Initialize components
    this.filterApplier = new FilterApplier(this.videoElement);
    const container = this.videoElement.parentElement || document.body;
    this.overlayManager = new OverlayManager(container);

    // Attach video interceptor
    this.videoInterceptor.attachToVideo(this.videoElement);

    // Set up frame capture callback
    this.videoInterceptor.onFrame((frame, timestamp) => {
      this.bufferManager.addFrame(
        this.base64ToImageData(frame),
        timestamp
      );

      // Send frame for analysis
      if (this.wsClient?.isConnected()) {
        this.wsClient.sendFrameAnalysis(frame, timestamp);
      }
    });

    // Initialize WebSocket connection
    this.connectWebSocket();

    // Listen for filter instructions
    if (this.wsClient) {
      this.wsClient.onFilterInstruction((instruction) => {
        this.handleFilterInstruction(instruction);
      });

      this.wsClient.onWarning((warning) => {
        this.showWarning(warning.category, warning.countdown);
      });
    }

    this.isActive = true;
    console.log('✅ Sentinella content script initialized');
  }

  private async connectWebSocket() {
    const userId = await this.getUserId();
    this.wsClient = new WebSocketClient(userId);

    try {
      await this.wsClient.connect();
      const streamId = this.getStreamId();
      if (streamId) {
        this.wsClient.joinStream(streamId, this.platform!);
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }

  private async getUserId(): Promise<string> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['userId'], (result) => {
        if (result.userId) {
          resolve(result.userId);
        } else {
          const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          chrome.storage.local.set({ userId });
          resolve(userId);
        }
      });
    });
  }

  private getStreamId(): string {
    // Extract stream ID from URL
    const url = window.location.href;
    if (this.platform === 'twitch') {
      const match = url.match(/twitch\.tv\/([^/?]+)/);
      return match ? match[1] : 'unknown';
    } else if (this.platform === 'youtube') {
      const match = url.match(/[?&]v=([^&]+)/);
      return match ? match[1] : 'unknown';
    }
    return 'unknown';
  }

  private base64ToImageData(base64: string): ImageData {
    // Simplified - in production, properly convert base64 to ImageData
    const img = new Image();
    img.src = base64;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = img.width || 1920;
    canvas.height = img.height || 1080;
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  private handleFilterInstruction(instruction: FilterInstruction) {
    if (!this.filterApplier) return;

    // Apply filter
    this.filterApplier.applyFilter(instruction);

    // Update stats
    this.sessionStats.itemsFiltered++;
    this.updateStatsDisplay();

    // Track event
    trackFilterTriggered({
      filterCategory: 'unknown', // Would come from detection
      confidenceScore: 0.8,
      detectionModel: 'marengo',
      streamPlatform: this.platform || 'unknown',
      timeInStream: this.videoElement?.currentTime || 0,
      bufferTimeRemaining: 4.0
    });

    // Add reveal button
    if (instruction.bbox && this.overlayManager) {
      this.overlayManager.addRevealButton(
        instruction.detectionId,
        instruction.bbox,
        () => this.handleReveal(instruction.detectionId)
      );
    }
  }

  private handleReveal(detectionId: string) {
    if (!this.filterApplier) return;

    // Remove filter
    this.filterApplier.removeFilter(detectionId);

    // Remove reveal button
    this.overlayManager?.removeRevealButton(detectionId);

    // Update stats
    this.sessionStats.itemsRevealed++;
    this.sessionStats.overrides++;
    this.updateStatsDisplay();

    // Track override
    trackFilterOverride({
      filterCategory: 'unknown',
      overrideType: 'reveal_once',
      timeToOverride: 1.2,
      sessionOverrideCount: this.sessionStats.overrides,
      totalOverrideCount: this.sessionStats.overrides,
      confidenceScore: 0.8
    });

    // Send override to backend
    this.wsClient?.sendOverride(detectionId, 'reveal_once');
  }

  private showWarning(category: string, countdown: number) {
    if (!this.overlayManager) return;

    this.overlayManager.showWarning(
      category,
      countdown,
      () => {
        // Show anyway - user dismissed warning
        console.log('User chose to show content');
      },
      () => {
        // Keep filtered - user wants to keep it hidden
        console.log('User chose to keep content filtered');
      }
    );
  }

  private updateStatsDisplay() {
    if (this.overlayManager) {
      this.overlayManager.showStatsIndicator(this.sessionStats.itemsFiltered);
    }

    // Update storage
    chrome.storage.local.set({ sessionStats: this.sessionStats });
  }

  destroy() {
    this.videoInterceptor.destroy();
    this.filterApplier?.destroy();
    this.overlayManager?.destroy();
    this.wsClient?.disconnect();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const sentinella = new SentinellaContentScript();
    sentinella.initialize();
  });
} else {
  const sentinella = new SentinellaContentScript();
  sentinella.initialize();
}

export {};
