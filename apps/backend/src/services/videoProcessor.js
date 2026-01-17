import ffmpeg from 'fluent-ffmpeg';
import { existsSync, mkdirSync, unlinkSync, readFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure uploads and processed directories exist
const UPLOADS_DIR = resolve(__dirname, '../../../uploads');
const PROCESSED_DIR = resolve(__dirname, '../../../processed');

[UPLOADS_DIR, PROCESSED_DIR].forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

export class VideoProcessor {
  constructor(moderationService) {
    this.moderationService = moderationService;
  }

  /**
   * Process uploaded video: detect profanities and apply censoring
   * @param {string} inputPath - Path to uploaded video file
   * @param {string} videoId - Unique ID for this video processing job
   * @returns {Promise<Object>} Processing result with output path and detections
   */
  async processVideo(inputPath, videoId) {
    try {
      console.log(`🎬 Starting video processing for ${videoId}`);
      
      // Step 1: Extract audio track
      const audioPath = join(UPLOADS_DIR, `${videoId}_audio.wav`);
      await this.extractAudio(inputPath, audioPath);
      console.log(`✅ Audio extracted to ${audioPath}`);

      // Step 2: Get video metadata
      const metadata = await this.getVideoMetadata(inputPath);
      const duration = metadata.duration;

      // Step 3: Analyze video frames and audio for profanities
      const detections = await this.analyzeVideo(inputPath, audioPath, videoId, duration);
      console.log(`📊 Found ${detections.length} profanity detections`);

      // Step 4: Apply censoring (blur visual profanity, bleep audio)
      const outputPath = join(PROCESSED_DIR, `${videoId}_censored.mp4`);
      await this.applyCensoring(inputPath, audioPath, outputPath, detections);
      console.log(`✅ Censored video saved to ${outputPath}`);

      // Cleanup temporary audio file
      if (existsSync(audioPath)) {
        unlinkSync(audioPath);
      }

      return {
        videoId,
        outputPath,
        detections,
        originalDuration: duration,
        status: 'completed'
      };
    } catch (error) {
      console.error(`❌ Error processing video ${videoId}:`, error);
      throw error;
    }
  }

  /**
   * Extract audio track from video
   */
  async extractAudio(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .output(outputPath)
        .audioCodec('pcm_s16le')
        .audioFrequency(16000)
        .noVideo()
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });
  }

  /**
   * Get video metadata (duration, resolution, etc.)
   */
  async getVideoMetadata(inputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) reject(err);
        else {
          const videoStream = metadata.streams.find(s => s.codec_type === 'video');
          const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
          resolve({
            duration: metadata.format.duration,
            width: videoStream?.width,
            height: videoStream?.height,
            fps: eval(videoStream?.r_frame_rate || '30/1'),
            audioChannels: audioStream?.channels,
            audioSampleRate: audioStream?.sample_rate
          });
        }
      });
    });
  }

  /**
   * Analyze video for profanities using Twelve Labs
   * Extracts frames and audio chunks, then analyzes them
   */
  async analyzeVideo(inputPath, audioPath, videoId, duration) {
    const detections = [];
    const frameInterval = 1; // Extract frame every 1 second
    const audioChunkDuration = 3; // Analyze audio in 3-second chunks

    // Analyze video frames
    const frameCount = Math.floor(duration / frameInterval);
    console.log(`🔍 Analyzing ${frameCount} video frames...`);

    for (let i = 0; i < frameCount; i++) {
      const timestamp = i * frameInterval;
      try {
        // Extract frame at timestamp
        const frameBuffer = await this.extractFrame(inputPath, timestamp);
        
        // Analyze frame for visual profanity/PII
        const frameModerations = await this.moderationService.processVideoFrame(
          frameBuffer,
          videoId,
          timestamp * 1000 // Convert to milliseconds
        );

        frameModerations.forEach(mod => {
          detections.push({
            type: 'visual',
            timestamp: mod.timestamp,
            duration: 1, // Frame duration
            category: mod.detection?.category || 'unknown',
            confidence: mod.detection?.confidence || 0,
            bbox: mod.detection?.bbox,
            action: 'blur'
          });
        });
      } catch (error) {
        console.warn(`⚠️  Error analyzing frame at ${timestamp}s:`, error.message);
      }
    }

    // Analyze audio chunks for profanity
    const audioChunkCount = Math.ceil(duration / audioChunkDuration);
    console.log(`🔍 Analyzing ${audioChunkCount} audio chunks...`);

    for (let i = 0; i < audioChunkCount; i++) {
      const startTime = i * audioChunkDuration;
      const endTime = Math.min(startTime + audioChunkDuration, duration);
      
      try {
        // Extract audio chunk
        const audioChunk = await this.extractAudioChunk(audioPath, startTime, endTime);
        
        // Analyze audio chunk for profanity
        const audioModerations = await this.moderationService.processAudioChunk(
          audioChunk,
          videoId,
          startTime * 1000, // Convert to milliseconds
          { previousTension: i > 0 ? detections[detections.length - 1]?.tensionScore : 0 }
        );

        audioModerations.forEach(mod => {
          const startMs = (mod.detection?.startTime || startTime) * 1000;
          const endMs = (mod.detection?.endTime || endTime) * 1000;
          
          detections.push({
            type: 'audio',
            timestamp: startMs,
            duration: (endMs - startMs) / 1000,
            category: mod.detection?.category || 'profanity',
            confidence: mod.detection?.confidence || 0,
            tensionScore: mod.detection?.tensionScore || 0,
            text: mod.detection?.text,
            action: 'bleep'
          });
        });
      } catch (error) {
        console.warn(`⚠️  Error analyzing audio chunk ${i}:`, error.message);
      }
    }

    // Sort detections by timestamp
    detections.sort((a, b) => a.timestamp - b.timestamp);

    return detections;
  }

  /**
   * Extract a single frame from video at specific timestamp
   */
  async extractFrame(inputPath, timestamp) {
    return new Promise((resolve, reject) => {
      const framePath = join(UPLOADS_DIR, `frame_${Date.now()}.jpg`);
      
      ffmpeg(inputPath)
        .seekInput(timestamp)
        .frames(1)
        .output(framePath)
        .on('end', () => {
          // Read frame as buffer
          const buffer = readFileSync(framePath);
          unlinkSync(framePath); // Cleanup
          resolve(buffer);
        })
        .on('error', (err) => reject(err))
        .run();
    });
  }

  /**
   * Extract audio chunk from audio file
   */
  async extractAudioChunk(audioPath, startTime, endTime) {
    return new Promise((resolve, reject) => {
      const chunkPath = join(UPLOADS_DIR, `chunk_${Date.now()}.wav`);
      const duration = endTime - startTime;
      
      ffmpeg(audioPath)
        .seekInput(startTime)
        .duration(duration)
        .output(chunkPath)
        .on('end', () => {
          const buffer = readFileSync(chunkPath);
          unlinkSync(chunkPath); // Cleanup
          resolve(buffer);
        })
        .on('error', (err) => reject(err))
        .run();
    });
  }

  /**
   * Apply censoring to video: blur visual detections, bleep audio detections
   */
  async applyCensoring(inputPath, audioPath, outputPath, detections) {
    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath);

      // Separate visual and audio detections
      const visualDetections = detections.filter(d => d.type === 'visual');
      const audioDetections = detections.filter(d => d.type === 'audio');

      // Apply visual blur filters (simplified - blur entire frame during profanity)
      if (visualDetections.length > 0) {
        // For now, apply blur to frames with visual profanity
        // In production, you'd want more precise bbox-based blurring
        const blurTimes = visualDetections.map(d => ({
          start: d.timestamp / 1000,
          end: (d.timestamp / 1000) + (d.duration || 1)
        }));
        
        if (blurTimes.length > 0) {
          // Apply boxblur during profanity timestamps
          const blurFilter = blurTimes.map(({ start, end }) => 
            `boxblur=enable='between(t,${start},${end})':luma_radius=15:chroma_radius=10`
          ).join(',');
          
          command = command.videoFilters(blurFilter);
        }
      }

      // Apply audio bleeps (mute profanity segments)
      if (audioDetections.length > 0) {
        // Build volume filter that mutes profanity segments
        const muteSegments = audioDetections.map(d => {
          const startTime = d.timestamp / 1000;
          const endTime = startTime + (d.duration || 1);
          return `volume=enable='between(t,${startTime},${endTime})':volume=0`;
        });
        
        // Chain volume filters (FFmpeg will apply them sequentially)
        if (muteSegments.length > 0) {
          // Use a single complex filter for better performance
          const volumeFilter = muteSegments.join(',');
          command = command.audioFilters(volumeFilter);
        }
      }

      command
        .output(outputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions('-preset', 'medium') // Faster encoding
        .on('end', () => resolve())
        .on('error', (err) => {
          console.error('FFmpeg error:', err.message);
          reject(err);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`   Processing: ${Math.round(progress.percent)}%`);
          }
        })
        .run();
    });
  }

  /**
   * Cleanup old processed videos (optional utility)
   */
  cleanupOldVideos(maxAgeHours = 24) {
    // Implementation for cleaning up old processed videos
    // Can be called periodically via cron job
  }
}
