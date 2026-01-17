import type { FilterCategory, AIAdjustment } from '../types';

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

export class OverlayManager {
  private video: HTMLVideoElement;
  private container: HTMLElement | null = null;
  private warningOverlay: HTMLElement | null = null;
  private indicatorOverlay: HTMLElement | null = null;
  private adjustmentOverlay: HTMLElement | null = null;
  private filteredCount = 0;

  constructor(video: HTMLVideoElement) {
    this.video = video;
    this.createContainer();
    this.createIndicator();
  }

  private createContainer() {
    const videoContainer = this.video.parentElement;
    if (!videoContainer) return;

    this.container = document.createElement('div');
    this.container.className = 'sentinella-overlay-container';
    this.container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    `;

    videoContainer.style.position = 'relative';
    videoContainer.appendChild(this.container);
  }

  private createIndicator() {
    if (!this.container) return;

    this.indicatorOverlay = document.createElement('div');
    this.indicatorOverlay.className = 'sentinella-indicator';
    this.indicatorOverlay.innerHTML = `
      <span style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: sentinella-pulse 2s infinite;"></span>
      <span style="color: #22c55e; font-weight: 500;">Sentinella</span>
      <span style="color: #94a3b8;">|</span>
      <span class="filter-count" style="color: #cbd5e1;">0 filtered</span>
    `;

    this.container.appendChild(this.indicatorOverlay);
  }

  /**
   * Show warning overlay before content is filtered
   */
  showWarning(
    category: FilterCategory,
    subcategory: string | undefined,
    triggerTime: number,
    onReveal: () => void,
    onKeep: () => void
  ) {
    if (!this.container) return;

    // Remove existing warning
    this.hideWarning();

    const countdown = Math.max(0, Math.ceil((triggerTime - Date.now()) / 1000));

    this.warningOverlay = document.createElement('div');
    this.warningOverlay.className = 'sentinella-warning';
    this.warningOverlay.style.pointerEvents = 'auto';
    this.warningOverlay.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 24px; margin-bottom: 8px;">⚠️</div>
        <div style="font-size: 14px; font-weight: 600; color: #f8fafc; margin-bottom: 4px;">
          CONTENT WARNING
        </div>
        <div style="font-size: 13px; color: #cbd5e1; margin-bottom: 12px;">
          <span style="background: rgba(239, 68, 68, 0.2); color: #fca5a5; padding: 2px 8px; border-radius: 4px;">
            ${FILTER_ICONS[category]} ${FILTER_LABELS[category]}${subcategory ? ` - ${subcategory}` : ''}
          </span>
          detected
        </div>
        <div style="font-size: 12px; color: #64748b; margin-bottom: 16px;">
          Filtering in: <span class="countdown" style="color: #fbbf24; font-weight: 600;">${countdown}</span> seconds
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="show-btn" style="
            flex: 1;
            padding: 8px 16px;
            background: transparent;
            border: 1px solid #475569;
            border-radius: 6px;
            color: #e2e8f0;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
          ">
            👁️ Show Anyway
          </button>
          <button class="keep-btn" style="
            flex: 1;
            padding: 8px 16px;
            background: #22c55e;
            border: none;
            border-radius: 6px;
            color: white;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
          ">
            ✓ Keep Filtered
          </button>
        </div>
      </div>
    `;

    // Add event listeners
    const showBtn = this.warningOverlay.querySelector('.show-btn') as HTMLButtonElement;
    const keepBtn = this.warningOverlay.querySelector('.keep-btn') as HTMLButtonElement;

    showBtn.addEventListener('click', () => {
      onReveal();
      this.hideWarning();
    });

    keepBtn.addEventListener('click', () => {
      onKeep();
      this.hideWarning();
      this.incrementFilterCount();
    });

    // Hover effects
    showBtn.addEventListener('mouseover', () => {
      showBtn.style.borderColor = '#22c55e';
      showBtn.style.color = '#22c55e';
    });
    showBtn.addEventListener('mouseout', () => {
      showBtn.style.borderColor = '#475569';
      showBtn.style.color = '#e2e8f0';
    });

    this.container.appendChild(this.warningOverlay);

    // Countdown timer
    const countdownEl = this.warningOverlay.querySelector('.countdown');
    let remaining = countdown;
    const interval = setInterval(() => {
      remaining--;
      if (countdownEl) countdownEl.textContent = String(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        this.hideWarning();
        this.incrementFilterCount();
      }
    }, 1000);
  }

  /**
   * Hide warning overlay
   */
  hideWarning() {
    if (this.warningOverlay) {
      this.warningOverlay.remove();
      this.warningOverlay = null;
    }
  }

  /**
   * Show AI adjustment notification
   */
  showAIAdjustment(
    adjustment: AIAdjustment,
    onAccept: () => void,
    onReject: () => void
  ) {
    if (!this.container) return;

    this.hideAdjustment();

    this.adjustmentOverlay = document.createElement('div');
    this.adjustmentOverlay.style.cssText = `
      position: absolute;
      top: 16px;
      right: 16px;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(168, 85, 247, 0.9));
      border: 1px solid rgba(167, 139, 250, 0.3);
      border-radius: 12px;
      padding: 16px;
      max-width: 300px;
      pointer-events: auto;
      font-family: 'Inter', system-ui, sans-serif;
      animation: sentinella-fade-in 0.3s ease-out;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    `;

    this.adjustmentOverlay.innerHTML = `
      <div style="display: flex; align-items: start; gap: 12px;">
        <span style="font-size: 24px;">🧠</span>
        <div style="flex: 1;">
          <div style="font-size: 13px; font-weight: 600; color: white; margin-bottom: 6px;">
            Sentinella noticed a pattern
          </div>
          <div style="font-size: 12px; color: rgba(255, 255, 255, 0.85); line-height: 1.5; margin-bottom: 12px;">
            ${adjustment.reason}
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="accept-btn" style="
              flex: 1;
              padding: 6px 12px;
              background: white;
              border: none;
              border-radius: 6px;
              color: #7c3aed;
              font-size: 12px;
              font-weight: 500;
              cursor: pointer;
            ">
              ✓ Sounds right
            </button>
            <button class="reject-btn" style="
              flex: 1;
              padding: 6px 12px;
              background: rgba(255, 255, 255, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.2);
              border-radius: 6px;
              color: white;
              font-size: 12px;
              font-weight: 500;
              cursor: pointer;
            ">
              ✕ Undo
            </button>
          </div>
        </div>
        <button class="close-btn" style="
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          font-size: 16px;
          padding: 0;
        ">×</button>
      </div>
    `;

    const acceptBtn = this.adjustmentOverlay.querySelector('.accept-btn') as HTMLButtonElement;
    const rejectBtn = this.adjustmentOverlay.querySelector('.reject-btn') as HTMLButtonElement;
    const closeBtn = this.adjustmentOverlay.querySelector('.close-btn') as HTMLButtonElement;

    acceptBtn.addEventListener('click', () => {
      onAccept();
      this.hideAdjustment();
    });

    rejectBtn.addEventListener('click', () => {
      onReject();
      this.hideAdjustment();
    });

    closeBtn.addEventListener('click', () => {
      this.hideAdjustment();
    });

    this.container.appendChild(this.adjustmentOverlay);

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (this.adjustmentOverlay) {
        onAccept(); // Implicit accept
        this.hideAdjustment();
      }
    }, 10000);
  }

  /**
   * Hide AI adjustment overlay
   */
  hideAdjustment() {
    if (this.adjustmentOverlay) {
      this.adjustmentOverlay.remove();
      this.adjustmentOverlay = null;
    }
  }

  /**
   * Increment and update filter count display
   */
  private incrementFilterCount() {
    this.filteredCount++;
    this.updateIndicator();
  }

  /**
   * Update the indicator display
   */
  private updateIndicator() {
    if (this.indicatorOverlay) {
      const countEl = this.indicatorOverlay.querySelector('.filter-count');
      if (countEl) {
        countEl.textContent = `${this.filteredCount} filtered`;
      }
    }
  }

  /**
   * Reset filter count
   */
  resetCount() {
    this.filteredCount = 0;
    this.updateIndicator();
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.hideWarning();
    this.hideAdjustment();
    this.container?.remove();
  }
}

