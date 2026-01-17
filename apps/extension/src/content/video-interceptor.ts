import type { BufferManager } from './buffer-manager';
import { FRAME_CAPTURE_INTERVAL_MS } from '../lib/constants';

export class VideoInterceptor {
  private video: HTMLVideoElement;
  private bufferManager: BufferManager;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private captureInterval: number | null = null;
  private isCapturing = false;

  constructor(video: HTMLVideoElement, bufferManager: BufferManager) {
    this.video = video;
    this.bufferManager = bufferManager;

    // Create offscreen canvas for frame capture
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * Start capturing frames from the video
   */
  startCapture(onFrame: (frame: string, timestamp: number) => void) {
    if (this.isCapturing) return;
    this.isCapturing = true;

    // Update canvas size when video dimensions change
    this.updateCanvasSize();

    this.captureInterval = window.setInterval(() => {
      if (this.video.paused || this.video.ended || this.video.readyState < 2) {
        return;
      }

      try {
        const frame = this.captureFrame();
        if (frame) {
          const timestamp = Date.now();
          
          // Add to buffer
          this.bufferManager.addFrame(frame, timestamp);
          
          // Send for analysis
          onFrame(frame, timestamp);
        }
      } catch (error) {
        console.error('[Sentinella] Frame capture error:', error);
      }
    }, FRAME_CAPTURE_INTERVAL_MS);

    // Listen for video resize
    this.video.addEventListener('resize', () => this.updateCanvasSize());
    this.video.addEventListener('loadedmetadata', () => this.updateCanvasSize());

    console.log('[Sentinella] Started frame capture');
  }

  /**
   * Stop capturing frames
   */
  stopCapture() {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    this.isCapturing = false;
    console.log('[Sentinella] Stopped frame capture');
  }

  /**
   * Capture a single frame
   */
  private captureFrame(): string | null {
    try {
      // Draw video frame to canvas
      this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

      // Convert to base64 JPEG (smaller than PNG)
      const dataUrl = this.canvas.toDataURL('image/jpeg', 0.7);
      
      // Remove the data URL prefix to get just the base64
      return dataUrl.split(',')[1];
    } catch (error) {
      // This can happen with cross-origin videos
      console.warn('[Sentinella] Could not capture frame:', error);
      return null;
    }
  }

  /**
   * Update canvas size to match video
   */
  private updateCanvasSize() {
    // Use a smaller resolution for faster processing
    const maxWidth = 640;
    const maxHeight = 360;

    const videoWidth = this.video.videoWidth || 1920;
    const videoHeight = this.video.videoHeight || 1080;

    const scale = Math.min(maxWidth / videoWidth, maxHeight / videoHeight);

    this.canvas.width = Math.round(videoWidth * scale);
    this.canvas.height = Math.round(videoHeight * scale);
  }

  /**
   * Get current video time
   */
  getCurrentTime(): number {
    return this.video.currentTime;
  }

  /**
   * Get video duration
   */
  getDuration(): number {
    return this.video.duration;
  }

  /**
   * Check if video is playing
   */
  isPlaying(): boolean {
    return !this.video.paused && !this.video.ended;
  }
}
