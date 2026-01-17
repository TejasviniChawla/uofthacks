// Video Interceptor - Captures frames from video elements for analysis

export class VideoInterceptor {
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private captureInterval: number | null = null;
  private frameCallback: ((frame: string, timestamp: number) => void) | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
  }

  // Attach to video element
  attachToVideo(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
    this.startCapturing();
  }

  // Start capturing frames
  startCapturing() {
    if (!this.videoElement || this.captureInterval) return;

    const captureIntervalMs = 200; // Capture every 200ms

    this.captureInterval = window.setInterval(() => {
      this.captureFrame();
    }, captureIntervalMs);
  }

  // Stop capturing
  stopCapturing() {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
  }

  // Capture current frame
  private captureFrame() {
    if (!this.videoElement || !this.frameCallback) return;

    try {
      // Check if video is ready
      if (this.videoElement.readyState < 2) return; // HAVE_CURRENT_DATA

      // Set canvas dimensions to match video
      this.canvas.width = this.videoElement.videoWidth || 1920;
      this.canvas.height = this.videoElement.videoHeight || 1080;

      // Draw video frame to canvas
      this.ctx.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);

      // Convert to base64
      const frameData = this.canvas.toDataURL('image/jpeg', 0.8);
      const timestamp = this.videoElement.currentTime * 1000; // Convert to ms

      // Callback with frame data
      this.frameCallback(frameData, timestamp);
    } catch (error) {
      console.error('Error capturing frame:', error);
    }
  }

  // Set callback for frame capture
  onFrame(callback: (frame: string, timestamp: number) => void) {
    this.frameCallback = callback;
  }

  // Get current video time
  getCurrentTime(): number {
    return this.videoElement?.currentTime || 0;
  }

  // Cleanup
  destroy() {
    this.stopCapturing();
    this.videoElement = null;
    this.frameCallback = null;
  }
}
