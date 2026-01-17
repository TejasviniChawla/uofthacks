// Overlay Manager - Manages warning overlays and reveal buttons

export class OverlayManager {
  private overlayContainer: HTMLDivElement | null = null;
  private activeWarnings: Map<string, HTMLDivElement> = new Map();
  private revealButtons: Map<string, HTMLButtonElement> = new Map();

  constructor(container: HTMLElement) {
    this.createOverlayContainer(container);
  }

  private createOverlayContainer(parent: HTMLElement) {
    this.overlayContainer = document.createElement('div');
    this.overlayContainer.id = 'sentinella-overlay-container';
    this.overlayContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10000;
    `;
    parent.appendChild(this.overlayContainer);
  }

  // Show content warning overlay (3-5 seconds before content)
  showWarning(category: string, countdown: number, onShowAnyway: () => void, onKeepFiltered: () => void) {
    const warningId = `warning-${Date.now()}`;
    const warning = document.createElement('div');
    warning.id = warningId;
    warning.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 24px 32px;
      border-radius: 12px;
      border: 2px solid #f59e0b;
      pointer-events: auto;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      z-index: 10001;
      min-width: 300px;
    `;

    warning.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 12px;">⚠️ CONTENT WARNING</div>
      <div style="font-size: 18px; margin-bottom: 8px; color: #f59e0b;">${category}</div>
      <div style="font-size: 14px; margin-bottom: 16px; opacity: 0.8;">Appearing in: <span id="countdown-${warningId}">${countdown}</span> seconds</div>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="show-anyway-${warningId}" style="
          background: #10b981;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        ">👁️ Show</button>
        <button id="keep-filtered-${warningId}" style="
          background: #6366f1;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        ">✓ Keep Hidden</button>
      </div>
    `;

    this.overlayContainer?.appendChild(warning);
    this.activeWarnings.set(warningId, warning);

    // Update countdown
    const countdownElement = warning.querySelector(`#countdown-${warningId}`);
    const countdownInterval = setInterval(() => {
      const remaining = parseFloat(countdownElement?.textContent || '0') - 0.1;
      if (countdownElement) {
        countdownElement.textContent = remaining.toFixed(1);
      }
      if (remaining <= 0) {
        clearInterval(countdownInterval);
      }
    }, 100);

    // Button handlers
    warning.querySelector(`#show-anyway-${warningId}`)?.addEventListener('click', () => {
      onShowAnyway();
      this.hideWarning(warningId);
      clearInterval(countdownInterval);
    });

    warning.querySelector(`#keep-filtered-${warningId}`)?.addEventListener('click', () => {
      onKeepFiltered();
      this.hideWarning(warningId);
      clearInterval(countdownInterval);
    });

    // Auto-hide after countdown
    setTimeout(() => {
      this.hideWarning(warningId);
      clearInterval(countdownInterval);
    }, countdown * 1000);
  }

  // Hide warning
  hideWarning(warningId: string) {
    const warning = this.activeWarnings.get(warningId);
    if (warning && warning.parentElement) {
      warning.parentElement.removeChild(warning);
      this.activeWarnings.delete(warningId);
    }
  }

  // Add reveal button to filtered region
  addRevealButton(
    detectionId: string,
    bbox: { x: number; y: number; width: number; height: number },
    onReveal: () => void
  ) {
    const button = document.createElement('button');
    button.id = `reveal-${detectionId}`;
    button.innerHTML = '👁️ Reveal';
    button.style.cssText = `
      position: absolute;
      left: ${bbox.x}px;
      top: ${bbox.y}px;
      background: rgba(99, 102, 241, 0.9);
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      pointer-events: auto;
      z-index: 10002;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;

    button.addEventListener('click', onReveal);
    this.overlayContainer?.appendChild(button);
    this.revealButtons.set(detectionId, button);
  }

  // Remove reveal button
  removeRevealButton(detectionId: string) {
    const button = this.revealButtons.get(detectionId);
    if (button && button.parentElement) {
      button.parentElement.removeChild(button);
      this.revealButtons.delete(detectionId);
    }
  }

  // Show session stats indicator
  showStatsIndicator(filteredCount: number) {
    let indicator = document.getElementById('sentinella-stats-indicator');
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'sentinella-stats-indicator';
      indicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        z-index: 10003;
        pointer-events: none;
      `;
      document.body.appendChild(indicator);
    }

    indicator.textContent = `🛡️ ${filteredCount} filtered`;
  }

  // Cleanup
  destroy() {
    this.activeWarnings.forEach(warning => {
      if (warning.parentElement) {
        warning.parentElement.removeChild(warning);
      }
    });
    this.revealButtons.forEach(button => {
      if (button.parentElement) {
        button.parentElement.removeChild(button);
      }
    });
    if (this.overlayContainer?.parentElement) {
      this.overlayContainer.parentElement.removeChild(this.overlayContainer);
    }
    const indicator = document.getElementById('sentinella-stats-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
}
