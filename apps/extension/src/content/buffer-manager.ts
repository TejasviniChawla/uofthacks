import type { FilterInstruction } from '../types';

interface BufferedFrame {
  frame: string;
  timestamp: number;
}

interface ScheduledFilter {
  instruction: FilterInstruction;
  callback: () => void;
  timeoutId: number;
}

export class BufferManager {
  private bufferDuration: number;
  private frames: BufferedFrame[] = [];
  private scheduledFilters: Map<string, ScheduledFilter> = new Map();
  private maxFrames = 30; // ~6 seconds at 5 fps

  constructor(bufferDurationMs: number) {
    this.bufferDuration = bufferDurationMs;
  }

  /**
   * Add a frame to the buffer
   */
  addFrame(frame: string, timestamp: number) {
    this.frames.push({ frame, timestamp });

    // Clean up old frames
    const cutoff = timestamp - this.bufferDuration - 2000; // Keep extra 2s
    this.frames = this.frames.filter(f => f.timestamp > cutoff);

    // Limit buffer size
    if (this.frames.length > this.maxFrames) {
      this.frames = this.frames.slice(-this.maxFrames);
    }
  }

  /**
   * Get frames in a time range
   */
  getFrames(startTime: number, endTime: number): BufferedFrame[] {
    return this.frames.filter(
      f => f.timestamp >= startTime && f.timestamp <= endTime
    );
  }

  /**
   * Get the current buffer delay
   */
  getBufferDelay(): number {
    if (this.frames.length < 2) return 0;
    const oldest = this.frames[0].timestamp;
    const newest = this.frames[this.frames.length - 1].timestamp;
    return newest - oldest;
  }

  /**
   * Schedule a filter to be applied at a specific time
   */
  scheduleFilter(instruction: FilterInstruction, callback: () => void) {
    const now = Date.now();
    const delay = Math.max(0, instruction.startTime - now);

    // Cancel existing filter for same detection
    this.cancelFilter(instruction.detectionId);

    const timeoutId = window.setTimeout(() => {
      callback();
      this.scheduledFilters.delete(instruction.detectionId);
    }, delay);

    this.scheduledFilters.set(instruction.detectionId, {
      instruction,
      callback,
      timeoutId,
    });

    console.log(`[Sentinella] Scheduled filter in ${delay}ms for ${instruction.detectionId}`);
  }

  /**
   * Cancel a scheduled filter
   */
  cancelFilter(detectionId: string): boolean {
    const scheduled = this.scheduledFilters.get(detectionId);
    if (scheduled) {
      clearTimeout(scheduled.timeoutId);
      this.scheduledFilters.delete(detectionId);
      console.log(`[Sentinella] Cancelled filter for ${detectionId}`);
      return true;
    }
    return false;
  }

  /**
   * Cancel all scheduled filters
   */
  cancelAllFilters() {
    for (const [id, scheduled] of this.scheduledFilters) {
      clearTimeout(scheduled.timeoutId);
    }
    this.scheduledFilters.clear();
  }

  /**
   * Get pending filter count
   */
  getPendingFilterCount(): number {
    return this.scheduledFilters.size;
  }

  /**
   * Clear the buffer
   */
  clear() {
    this.frames = [];
    this.cancelAllFilters();
  }

  /**
   * Get buffer status for debugging
   */
  getStatus() {
    return {
      frameCount: this.frames.length,
      bufferDuration: this.getBufferDelay(),
      pendingFilters: this.scheduledFilters.size,
      oldestFrame: this.frames[0]?.timestamp,
      newestFrame: this.frames[this.frames.length - 1]?.timestamp,
    };
  }
}
