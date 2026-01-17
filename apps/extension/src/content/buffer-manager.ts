// Buffer Manager - Implements 5-second delay buffer for pre-cognitive filtering

export class BufferManager {
  private bufferDuration: number = 5000; // 5 seconds
  private videoBuffer: Array<{ frame: ImageData; timestamp: number }> = [];
  private audioBuffer: Array<{ audio: Float32Array; timestamp: number }> = [];
  private playbackOffset: number = 0;

  constructor(bufferDurationMs: number = 5000) {
    this.bufferDuration = bufferDurationMs;
  }

  // Add frame to buffer
  addFrame(frame: ImageData, timestamp: number) {
    this.videoBuffer.push({ frame, timestamp });
    
    // Remove frames older than buffer duration
    const cutoff = timestamp - this.bufferDuration;
    this.videoBuffer = this.videoBuffer.filter(item => item.timestamp >= cutoff);
  }

  // Add audio chunk to buffer
  addAudioChunk(audio: Float32Array, timestamp: number) {
    this.audioBuffer.push({ audio, timestamp });
    
    // Remove audio older than buffer duration
    const cutoff = timestamp - this.bufferDuration;
    this.audioBuffer = this.audioBuffer.filter(item => item.timestamp >= cutoff);
  }

  // Get frame that should be displayed now (accounting for buffer delay)
  getCurrentFrame(currentTime: number): ImageData | null {
    const targetTime = currentTime - this.bufferDuration;
    const frame = this.videoBuffer.find(
      item => Math.abs(item.timestamp - targetTime) < 100 // 100ms tolerance
    );
    return frame?.frame || null;
  }

  // Get audio that should be played now
  getCurrentAudio(currentTime: number): Float32Array | null {
    const targetTime = currentTime - this.bufferDuration;
    const audio = this.audioBuffer.find(
      item => Math.abs(item.timestamp - targetTime) < 100
    );
    return audio?.audio || null;
  }

  // Get frames in the buffer window (for analysis)
  getBufferWindow(currentTime: number): Array<{ frame: ImageData; timestamp: number }> {
    const windowStart = currentTime;
    const windowEnd = currentTime + this.bufferDuration;
    return this.videoBuffer.filter(
      item => item.timestamp >= windowStart && item.timestamp <= windowEnd
    );
  }

  // Get audio in the buffer window
  getAudioWindow(currentTime: number): Array<{ audio: Float32Array; timestamp: number }> {
    const windowStart = currentTime;
    const windowEnd = currentTime + this.bufferDuration;
    return this.audioBuffer.filter(
      item => item.timestamp >= windowStart && item.timestamp <= windowEnd
    );
  }

  // Clear buffers
  clear() {
    this.videoBuffer = [];
    this.audioBuffer = [];
  }

  // Get buffer status
  getStatus() {
    return {
      videoBufferSize: this.videoBuffer.length,
      audioBufferSize: this.audioBuffer.length,
      bufferDuration: this.bufferDuration,
      oldestVideoTimestamp: this.videoBuffer[0]?.timestamp || null,
      newestVideoTimestamp: this.videoBuffer[this.videoBuffer.length - 1]?.timestamp || null
    };
  }
}
