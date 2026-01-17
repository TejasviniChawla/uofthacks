import { VideoInterceptor } from './video-interceptor';
import { BufferManager } from './buffer-manager';
import { FilterApplier } from './filter-applier';
import { OverlayManager } from './overlay-manager';
import { wsClient } from '../lib/websocket';
import { amplitude } from '../lib/amplitude';
import { getUserId, getActiveProfile, incrementFiltered, incrementRevealed } from '../lib/storage';
import type { WSMessage, FilterInstruction, Detection, AIAdjustment } from '../types';

class SentinellaContentScript {
  private videoInterceptor: VideoInterceptor | null = null;
  private bufferManager: BufferManager | null = null;
  private filterApplier: FilterApplier | null = null;
  private overlayManager: OverlayManager | null = null;
  private platform: 'twitch' | 'youtube' | null = null;
  private initialized = false;

  async init() {
    if (this.initialized) return;

    // Detect platform
    this.platform = this.detectPlatform();
    if (!this.platform) {
      console.log('[Sentinella] Not on a supported platform');
      return;
    }

    console.log(`[Sentinella] Initializing on ${this.platform}`);

    // Get user ID and profile
    const userId = await getUserId();
    const profile = await getActiveProfile();

    // Initialize Amplitude
    amplitude.init(userId);
    amplitude.trackSessionStart(
      this.platform,
      profile.name,
      profile.filters.filter(f => f.level !== 'off').length
    );

    // Wait for video element
    const video = await this.waitForVideo();
    if (!video) {
      console.error('[Sentinella] Could not find video element');
      return;
    }

    // Initialize components
    this.bufferManager = new BufferManager(5000); // 5 second buffer
    this.filterApplier = new FilterApplier(video);
    this.overlayManager = new OverlayManager(video);
    this.videoInterceptor = new VideoInterceptor(video, this.bufferManager);

    // Connect to WebSocket
    wsClient.connect(userId, this.platform);

    // Listen for WebSocket messages
    wsClient.onMessage((message) => this.handleWSMessage(message));

    // Start capturing frames
    this.videoInterceptor.startCapture((frame, timestamp) => {
      wsClient.sendFrame(frame, timestamp);
    });

    // Inject overlay styles
    this.injectStyles();

    this.initialized = true;
    console.log('[Sentinella] Content script initialized');
  }

  private detectPlatform(): 'twitch' | 'youtube' | null {
    const hostname = window.location.hostname;
    if (hostname.includes('twitch.tv')) return 'twitch';
    if (hostname.includes('youtube.com')) return 'youtube';
    return null;
  }

  private async waitForVideo(): Promise<HTMLVideoElement | null> {
    const selectors = {
      twitch: 'video',
      youtube: 'video.html5-main-video',
    };

    const selector = this.platform ? selectors[this.platform] : 'video';

    // Try immediately
    let video = document.querySelector<HTMLVideoElement>(selector);
    if (video) return video;

    // Wait and retry
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 50; // 10 seconds max

      const interval = setInterval(() => {
        video = document.querySelector<HTMLVideoElement>(selector);
        if (video || attempts >= maxAttempts) {
          clearInterval(interval);
          resolve(video || null);
        }
        attempts++;
      }, 200);
    });
  }

  private handleWSMessage(message: WSMessage) {
    switch (message.type) {
      case 'filter_instruction':
        this.handleFilterInstructions(message.payload);
        break;

      case 'ai_adjustment':
        this.handleAIAdjustment(message.payload);
        break;

      case 'session_stats':
        // Stats are handled by popup
        break;

      case 'error':
        console.error('[Sentinella] Server error:', message.payload.error);
        break;
    }
  }

  private async handleFilterInstructions(payload: {
    instructions: FilterInstruction[];
    detections: Detection[];
    bufferPosition: number;
  }) {
    const { instructions, detections } = payload;

    for (const instruction of instructions) {
      const detection = detections.find(d => d.id === instruction.detectionId);
      if (!detection) continue;

      // Show warning overlay
      this.overlayManager?.showWarning(
        detection.type,
        detection.subtype,
        instruction.startTime,
        () => this.handleReveal(detection, instruction),
        () => this.handleKeepFiltered(detection, instruction)
      );

      // Schedule filter application
      this.bufferManager?.scheduleFilter(instruction, () => {
        this.filterApplier?.applyFilter(instruction);
        incrementFiltered(detection.type);
      });
    }
  }

  private handleReveal(detection: Detection, instruction: FilterInstruction) {
    // Cancel the scheduled filter
    this.bufferManager?.cancelFilter(instruction.detectionId);
    
    // Track override
    wsClient.sendOverride(detection.type, detection.subtype, 'reveal_once');
    incrementRevealed();

    // Hide overlay
    this.overlayManager?.hideWarning();
  }

  private handleKeepFiltered(detection: Detection, instruction: FilterInstruction) {
    // Filter will be applied as scheduled
    this.overlayManager?.hideWarning();
  }

  private handleAIAdjustment(adjustment: AIAdjustment) {
    this.overlayManager?.showAIAdjustment(
      adjustment,
      () => {
        // Accept adjustment
        amplitude.trackAdjustmentResponse(adjustment.category, true, 'explicit_accept');
      },
      () => {
        // Reject adjustment
        amplitude.trackAdjustmentResponse(adjustment.category, false, 'explicit_reject');
      }
    );
  }

  private injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .sentinella-overlay {
        position: absolute;
        z-index: 9999;
        pointer-events: none;
      }

      .sentinella-warning {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(15, 23, 42, 0.95);
        border: 1px solid rgba(34, 197, 94, 0.3);
        border-radius: 12px;
        padding: 20px 24px;
        z-index: 10000;
        pointer-events: auto;
        font-family: 'Inter', system-ui, sans-serif;
        animation: sentinella-fade-in 0.3s ease-out;
      }

      .sentinella-filter {
        position: absolute;
        pointer-events: none;
        z-index: 9998;
      }

      .sentinella-blur {
        backdrop-filter: blur(30px);
        background: rgba(15, 23, 42, 0.3);
      }

      .sentinella-black-box {
        background: #000;
      }

      .sentinella-dim {
        background: rgba(0, 0, 0, 0.7);
      }

      .sentinella-indicator {
        position: absolute;
        bottom: 16px;
        right: 16px;
        background: rgba(15, 23, 42, 0.9);
        border: 1px solid rgba(34, 197, 94, 0.3);
        border-radius: 8px;
        padding: 8px 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 12px;
        color: #e2e8f0;
        z-index: 9997;
      }

      .sentinella-reveal-btn {
        position: absolute;
        bottom: 8px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(15, 23, 42, 0.9);
        border: 1px solid rgba(100, 116, 139, 0.5);
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 11px;
        color: #cbd5e1;
        cursor: pointer;
        transition: all 0.15s ease;
        z-index: 10001;
      }

      .sentinella-reveal-btn:hover {
        background: rgba(30, 41, 59, 0.95);
        border-color: rgba(34, 197, 94, 0.5);
        color: #22c55e;
      }

      @keyframes sentinella-fade-in {
        from {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
      }

      @keyframes sentinella-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);
  }

  cleanup() {
    this.videoInterceptor?.stopCapture();
    wsClient.disconnect();
    this.overlayManager?.cleanup();
    this.filterApplier?.cleanup();
  }
}

// Initialize
const sentinella = new SentinellaContentScript();
sentinella.init();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  sentinella.cleanup();
});

// Re-initialize on SPA navigation
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    sentinella.cleanup();
    setTimeout(() => sentinella.init(), 1000);
  }
}).observe(document, { subtree: true, childList: true });
