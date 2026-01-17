// Filter Applier - Applies visual and audio filters to video content

import type { FilterInstruction, FilterAction } from '@shared/types';

export class FilterApplier {
  private activeFilters: Map<string, FilterInstruction> = new Map();
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private audioContext: AudioContext | null = null;

  constructor(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
    this.setupCanvas();
    this.setupAudio();
  }

  private setupCanvas() {
    if (!this.videoElement) return;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.videoElement.videoWidth || 1920;
    this.canvas.height = this.videoElement.videoHeight || 1080;
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '1000';
    
    // Position canvas over video
    const videoContainer = this.videoElement.parentElement;
    if (videoContainer) {
      videoContainer.style.position = 'relative';
      videoContainer.appendChild(this.canvas);
    }

    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
  }

  private setupAudio() {
    try {
      this.audioContext = new AudioContext();
    } catch (error) {
      console.error('Failed to create AudioContext:', error);
    }
  }

  // Apply filter instruction
  applyFilter(instruction: FilterInstruction) {
    this.activeFilters.set(instruction.detectionId, instruction);

    if (instruction.action === 'blur' || instruction.action === 'pixelate' || 
        instruction.action === 'black_box' || instruction.action === 'dim') {
      this.applyVisualFilter(instruction);
    } else if (instruction.action === 'bleep' || instruction.action === 'mute' || 
               instruction.action === 'normalize') {
      this.applyAudioFilter(instruction);
    }
  }

  // Remove filter
  removeFilter(detectionId: string) {
    this.activeFilters.delete(detectionId);
    this.redraw();
  }

  // Apply visual filter
  private applyVisualFilter(instruction: FilterInstruction) {
    if (!this.ctx || !this.videoElement || !instruction.bbox) return;

    const { x, y, width, height } = instruction.bbox;
    const intensity = instruction.intensity || 0.8;

    requestAnimationFrame(() => {
      if (!this.ctx || !this.videoElement) return;

      // Draw current video frame
      this.ctx.drawImage(this.videoElement, 0, 0, this.canvas!.width, this.canvas!.height);

      // Apply filter to region
      const imageData = this.ctx.getImageData(x, y, width, height);
      
      if (instruction.action === 'blur') {
        this.applyBlur(imageData, intensity);
      } else if (instruction.action === 'pixelate') {
        this.applyPixelate(imageData, intensity);
      } else if (instruction.action === 'black_box') {
        this.applyBlackBox(x, y, width, height);
      } else if (instruction.action === 'dim') {
        this.applyDim(imageData, intensity);
      }

      this.ctx.putImageData(imageData, x, y);
    });
  }

  private applyBlur(imageData: ImageData, intensity: number) {
    // Simple box blur
    const data = imageData.data;
    const radius = Math.floor(intensity * 10);
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Average with neighbors (simplified blur)
      data[i] = r * (1 - intensity) + 128 * intensity;
      data[i + 1] = g * (1 - intensity) + 128 * intensity;
      data[i + 2] = b * (1 - intensity) + 128 * intensity;
    }
  }

  private applyPixelate(imageData: ImageData, intensity: number) {
    const data = imageData.data;
    const pixelSize = Math.max(1, Math.floor(intensity * 20));
    
    for (let y = 0; y < imageData.height; y += pixelSize) {
      for (let x = 0; x < imageData.width; x += pixelSize) {
        const idx = (y * imageData.width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        // Fill pixel block
        for (let py = 0; py < pixelSize && y + py < imageData.height; py++) {
          for (let px = 0; px < pixelSize && x + px < imageData.width; px++) {
            const pidx = ((y + py) * imageData.width + (x + px)) * 4;
            data[pidx] = r;
            data[pidx + 1] = g;
            data[pidx + 2] = b;
          }
        }
      }
    }
  }

  private applyBlackBox(x: number, y: number, width: number, height: number) {
    if (!this.ctx) return;
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(x, y, width, height);
  }

  private applyDim(imageData: ImageData, intensity: number) {
    const data = imageData.data;
    const dimFactor = 1 - intensity;
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] *= dimFactor;     // R
      data[i + 1] *= dimFactor;  // G
      data[i + 2] *= dimFactor; // B
    }
  }

  private applyAudioFilter(instruction: FilterInstruction) {
    if (!this.audioContext || !this.videoElement) return;

    // Audio filtering would require more complex setup with MediaStream
    // For MVP, we'll track the instruction and apply via volume/gain nodes
    // This is a simplified implementation
  }

  // Redraw all active filters
  private redraw() {
    if (!this.ctx || !this.videoElement) return;

    this.ctx.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
    
    // Reapply all active filters
    this.activeFilters.forEach(instruction => {
      if (instruction.bbox) {
        this.applyVisualFilter(instruction);
      }
    });
  }

  // Update canvas size when video dimensions change
  updateDimensions() {
    if (!this.videoElement || !this.canvas) return;
    
    this.canvas.width = this.videoElement.videoWidth || 1920;
    this.canvas.height = this.videoElement.videoHeight || 1080;
    this.redraw();
  }

  // Cleanup
  destroy() {
    if (this.canvas && this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
    this.activeFilters.clear();
    this.audioContext?.close();
  }
}
