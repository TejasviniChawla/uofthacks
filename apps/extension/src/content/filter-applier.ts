import type { FilterInstruction, VisualFilterType, AudioFilterType } from '../types';

interface ActiveFilter {
  id: string;
  element: HTMLElement;
  instruction: FilterInstruction;
  endTimeout: number;
}

export class FilterApplier {
  private video: HTMLVideoElement;
  private container: HTMLElement | null = null;
  private activeFilters: Map<string, ActiveFilter> = new Map();
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private originalVolume: number = 1;

  constructor(video: HTMLVideoElement) {
    this.video = video;
    this.createContainer();
    this.setupAudioContext();
  }

  private createContainer() {
    // Find or create container for filter overlays
    const videoContainer = this.video.parentElement;
    if (!videoContainer) return;

    // Create overlay container
    this.container = document.createElement('div');
    this.container.className = 'sentinella-filter-container';
    this.container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
    `;

    // Insert after video
    videoContainer.style.position = 'relative';
    videoContainer.appendChild(this.container);
  }

  private setupAudioContext() {
    try {
      this.audioContext = new AudioContext();
      // Note: We can't easily intercept audio from a video element
      // In a real implementation, this would use Web Audio API with MediaElementSource
      // For demo, we'll just control the video's volume property
    } catch (error) {
      console.warn('[Sentinella] Could not create audio context:', error);
    }
  }

  /**
   * Apply a visual filter
   */
  applyFilter(instruction: FilterInstruction) {
    const isVisual = ['blur', 'black_box', 'pixelate', 'dim'].includes(instruction.filterType);
    
    if (isVisual) {
      this.applyVisualFilter(instruction);
    } else {
      this.applyAudioFilter(instruction);
    }
  }

  private applyVisualFilter(instruction: FilterInstruction) {
    if (!this.container) return;

    // Remove existing filter for this detection
    this.removeFilter(instruction.detectionId);

    // Create filter element
    const filterElement = document.createElement('div');
    filterElement.className = `sentinella-filter sentinella-${instruction.filterType}`;
    filterElement.dataset.detectionId = instruction.detectionId;

    // Position filter
    if (instruction.bbox) {
      const videoRect = this.video.getBoundingClientRect();
      const containerRect = this.container.getBoundingClientRect();

      // Scale bbox to container size
      const scaleX = containerRect.width / (this.video.videoWidth || 1920);
      const scaleY = containerRect.height / (this.video.videoHeight || 1080);

      filterElement.style.cssText = `
        position: absolute;
        left: ${instruction.bbox.x * scaleX}px;
        top: ${instruction.bbox.y * scaleY}px;
        width: ${instruction.bbox.width * scaleX}px;
        height: ${instruction.bbox.height * scaleY}px;
        border-radius: 8px;
      `;
    } else {
      // Full video filter
      filterElement.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      `;
    }

    // Apply filter styles based on type and intensity
    this.applyFilterStyle(filterElement, instruction.filterType as VisualFilterType, instruction.intensity);

    // Add reveal button
    const revealBtn = document.createElement('button');
    revealBtn.className = 'sentinella-reveal-btn';
    revealBtn.textContent = '👁️ Reveal';
    revealBtn.onclick = () => this.removeFilter(instruction.detectionId);
    filterElement.appendChild(revealBtn);

    // Add to container
    this.container.appendChild(filterElement);

    // Schedule removal
    const duration = instruction.endTime - instruction.startTime;
    const endTimeout = window.setTimeout(() => {
      this.removeFilter(instruction.detectionId);
    }, duration);

    this.activeFilters.set(instruction.detectionId, {
      id: instruction.detectionId,
      element: filterElement,
      instruction,
      endTimeout,
    });

    console.log(`[Sentinella] Applied ${instruction.filterType} filter`);
  }

  private applyFilterStyle(element: HTMLElement, filterType: VisualFilterType, intensity: number) {
    switch (filterType) {
      case 'blur':
        const blurAmount = 10 + intensity * 40; // 10-50px blur
        element.style.backdropFilter = `blur(${blurAmount}px)`;
        element.style.background = 'rgba(15, 23, 42, 0.3)';
        break;

      case 'black_box':
        element.style.background = `rgba(0, 0, 0, ${0.7 + intensity * 0.3})`;
        break;

      case 'pixelate':
        // CSS can't pixelate, so we use a mosaic effect with blur + contrast
        element.style.backdropFilter = `blur(${10 + intensity * 20}px) contrast(0.8)`;
        element.style.background = 'rgba(15, 23, 42, 0.4)';
        break;

      case 'dim':
        element.style.background = `rgba(0, 0, 0, ${0.5 + intensity * 0.4})`;
        break;
    }
  }

  private applyAudioFilter(instruction: FilterInstruction) {
    const filterType = instruction.filterType as AudioFilterType;
    const duration = instruction.endTime - instruction.startTime;

    switch (filterType) {
      case 'bleep':
        // Play bleep sound and mute original
        this.playBleep(duration);
        this.muteTemporarily(duration);
        break;

      case 'silence':
        this.muteTemporarily(duration);
        break;

      case 'muffle':
        // Lower volume significantly
        this.adjustVolumeTemporarily(0.1, duration);
        break;

      case 'normalize':
        // Reduce volume if too loud
        if (this.video.volume > 0.5) {
          this.adjustVolumeTemporarily(0.5, duration);
        }
        break;
    }

    console.log(`[Sentinella] Applied ${filterType} audio filter for ${duration}ms`);
  }

  private playBleep(duration: number) {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = 1000; // 1kHz bleep

      gainNode.gain.value = 0.3;

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn('[Sentinella] Could not play bleep:', error);
    }
  }

  private muteTemporarily(duration: number) {
    this.originalVolume = this.video.volume;
    this.video.volume = 0;

    setTimeout(() => {
      this.video.volume = this.originalVolume;
    }, duration);
  }

  private adjustVolumeTemporarily(targetVolume: number, duration: number) {
    this.originalVolume = this.video.volume;
    this.video.volume = targetVolume;

    setTimeout(() => {
      this.video.volume = this.originalVolume;
    }, duration);
  }

  /**
   * Remove a specific filter
   */
  removeFilter(detectionId: string) {
    const filter = this.activeFilters.get(detectionId);
    if (filter) {
      clearTimeout(filter.endTimeout);
      filter.element.remove();
      this.activeFilters.delete(detectionId);
      console.log(`[Sentinella] Removed filter ${detectionId}`);
    }
  }

  /**
   * Remove all filters
   */
  removeAllFilters() {
    for (const [id] of this.activeFilters) {
      this.removeFilter(id);
    }
  }

  /**
   * Get active filter count
   */
  getActiveFilterCount(): number {
    return this.activeFilters.size;
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.removeAllFilters();
    this.container?.remove();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
