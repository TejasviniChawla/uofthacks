/**
 * Demo Mode - Simulates content detection for hackathon demonstration
 * This shows what the extension WOULD do when content is detected
 */

import type { FilterCategory } from '../types';

const FILTER_ICONS: Record<FilterCategory, string> = {
  profanity: '🔇',
  violence: '🩸',
  sexual: '🔞',
  jumpscares: '⚡',
  flashing: '💥',
  spoilers: '🎮',
  loud_audio: '📢',
  hate_speech: '🚫',
};

const FILTER_LABELS: Record<FilterCategory, string> = {
  profanity: 'Profanity',
  violence: 'Violence',
  sexual: 'Sexual Content',
  jumpscares: 'Jumpscare',
  flashing: 'Flashing',
  spoilers: 'Spoiler',
  loud_audio: 'Loud Audio',
  hate_speech: 'Hate Speech',
};

export class DemoMode {
  private video: HTMLVideoElement | null = null;
  private container: HTMLElement | null = null;
  private isRunning = false;
  private demoInterval: number | null = null;
  private filteredCount = 0;
  private indicator: HTMLElement | null = null;

  start() {
    this.findVideo();
    if (!this.video) {
      console.log('[Sentinella Demo] No video found, retrying...');
      setTimeout(() => this.start(), 2000);
      return;
    }

    this.createContainer();
    this.createIndicator();
    this.isRunning = true;

    // Simulate random detections every 15-30 seconds
    this.scheduleNextDetection();

    console.log('[Sentinella Demo] Demo mode started!');
  }

  private findVideo() {
    // Try YouTube selector first
    this.video = document.querySelector('video.html5-main-video');
    // Fallback to any video
    if (!this.video) {
      this.video = document.querySelector('video');
    }
  }

  private createContainer() {
    if (!this.video) return;

    const videoContainer = this.video.parentElement;
    if (!videoContainer) return;

    this.container = document.createElement('div');
    this.container.id = 'sentinella-demo-container';
    this.container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    `;

    videoContainer.style.position = 'relative';
    videoContainer.appendChild(this.container);
  }

  private createIndicator() {
    if (!this.container) return;

    this.indicator = document.createElement('div');
    this.indicator.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: pulse 2s infinite;"></span>
        <span style="color: #22c55e; font-weight: 600;">Sentinella</span>
        <span style="color: #64748b;">|</span>
        <span style="color: #94a3b8;" id="sentinella-count">0 filtered</span>
      </div>
      <style>
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      </style>
    `;
    this.indicator.style.cssText = `
      position: absolute;
      bottom: 60px;
      right: 16px;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 12px;
      z-index: 10000;
      pointer-events: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    `;

    this.container.appendChild(this.indicator);
  }

  private firstDetection = true;

  private scheduleNextDetection() {
    if (!this.isRunning) return;

    // First detection after 3 seconds, then random 10-25 seconds
    const delay = this.firstDetection ? 3000 : (10000 + Math.random() * 15000);
    this.firstDetection = false;

    this.demoInterval = window.setTimeout(() => {
      this.simulateDetection();
      this.scheduleNextDetection();
    }, delay);
  }

  private simulateDetection() {
    if (!this.container || !this.video) return;
    if (this.video.paused) return; // Only detect when playing

    // Pick a random category
    const categories: FilterCategory[] = ['profanity', 'violence', 'jumpscares', 'loud_audio'];
    const category = categories[Math.floor(Math.random() * categories.length)];

    // Show warning
    this.showWarning(category);
  }

  private showWarning(category: FilterCategory) {
    if (!this.container) return;

    const warning = document.createElement('div');
    warning.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(15, 23, 42, 0.98);
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-radius: 16px;
      padding: 24px 32px;
      text-align: center;
      z-index: 10001;
      pointer-events: auto;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
      animation: slideIn 0.3s ease-out;
    `;

    warning.innerHTML = `
      <style>
        @keyframes slideIn {
          from { opacity: 0; transform: translate(-50%, -60%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
      </style>
      <div style="font-size: 32px; margin-bottom: 12px;">⚠️</div>
      <div style="font-size: 16px; font-weight: 700; color: #f8fafc; margin-bottom: 8px;">
        CONTENT WARNING
      </div>
      <div style="margin-bottom: 16px;">
        <span style="background: rgba(239, 68, 68, 0.2); color: #fca5a5; padding: 4px 12px; border-radius: 6px; font-size: 14px;">
          ${FILTER_ICONS[category]} ${FILTER_LABELS[category]}
        </span>
        <span style="color: #94a3b8; font-size: 14px; margin-left: 8px;">detected</span>
      </div>
      <div style="font-size: 13px; color: #64748b; margin-bottom: 20px;">
        Filtering in: <span id="countdown" style="color: #fbbf24; font-weight: 600;">3</span> seconds
      </div>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="show-btn" style="
          padding: 10px 20px;
          background: transparent;
          border: 1px solid #475569;
          border-radius: 8px;
          color: #e2e8f0;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        ">
          👁️ Show Anyway
        </button>
        <button id="keep-btn" style="
          padding: 10px 20px;
          background: #22c55e;
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        ">
          ✓ Keep Filtered
        </button>
      </div>
    `;

    this.container.appendChild(warning);

    // Countdown
    let count = 3;
    const countdownEl = warning.querySelector('#countdown');
    const countdownInterval = setInterval(() => {
      count--;
      if (countdownEl) countdownEl.textContent = String(count);
      if (count <= 0) {
        clearInterval(countdownInterval);
        warning.remove();
        this.applyFilter(category);
      }
    }, 1000);

    // Button handlers
    warning.querySelector('#show-btn')?.addEventListener('click', () => {
      clearInterval(countdownInterval);
      warning.remove();
      this.showToast('Content revealed - AI will learn from this preference');
    });

    warning.querySelector('#keep-btn')?.addEventListener('click', () => {
      clearInterval(countdownInterval);
      warning.remove();
      this.applyFilter(category);
    });
  }

  private applyFilter(category: FilterCategory) {
    if (!this.container) return;

    this.filteredCount++;
    this.updateIndicator();

    // Create blur overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(20px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9998;
      pointer-events: auto;
      animation: fadeIn 0.3s ease-out;
    `;

    overlay.innerHTML = `
      <style>
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      </style>
      <div style="font-size: 48px; margin-bottom: 16px;">${FILTER_ICONS[category]}</div>
      <div style="font-size: 18px; font-weight: 600; color: white; margin-bottom: 8px;">
        ${FILTER_LABELS[category]} Filtered
      </div>
      <div style="font-size: 14px; color: #94a3b8; margin-bottom: 24px;">
        Content hidden based on your preferences
      </div>
      <button id="reveal-btn" style="
        padding: 12px 24px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      ">
        👁️ Click to Reveal
      </button>
    `;

    this.container.appendChild(overlay);

    // Auto-remove after 5 seconds
    const timeout = setTimeout(() => {
      overlay.remove();
    }, 5000);

    // Reveal button
    overlay.querySelector('#reveal-btn')?.addEventListener('click', () => {
      clearTimeout(timeout);
      overlay.remove();
    });
  }

  private updateIndicator() {
    const countEl = document.getElementById('sentinella-count');
    if (countEl) {
      countEl.textContent = `${this.filteredCount} filtered`;
    }
  }

  private showToast(message: string) {
    if (!this.container) return;

    const toast = document.createElement('div');
    toast.style.cssText = `
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(168, 85, 247, 0.9));
      border-radius: 10px;
      padding: 12px 20px;
      color: white;
      font-size: 13px;
      font-weight: 500;
      z-index: 10002;
      box-shadow: 0 10px 40px rgba(139, 92, 246, 0.3);
      animation: slideDown 0.3s ease-out;
    `;
    toast.innerHTML = `
      <style>
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      </style>
      🧠 ${message}
    `;

    this.container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  stop() {
    this.isRunning = false;
    if (this.demoInterval) {
      clearTimeout(this.demoInterval);
    }
    this.container?.remove();
  }
}

// Auto-start demo mode
console.log('[Sentinella] Content script loaded!');
const demo = new DemoMode();

// Start immediately and retry aggressively
function tryStart() {
  console.log('[Sentinella] Attempting to start demo...');
  demo.start();
}

// Try multiple times to ensure it catches the video
setTimeout(tryStart, 500);
setTimeout(tryStart, 2000);
setTimeout(tryStart, 5000);

// Restart on navigation (for SPAs like YouTube)
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    demo.stop();
    setTimeout(() => demo.start(), 2000);
  }
}).observe(document, { subtree: true, childList: true });

