import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { initializeAnalytics } from './analytics/amplitude.js';
import { StreamProcessor } from './services/streamProcessor.js';
import { ModerationService } from './services/moderationService.js';
import { AdaptiveLearner } from './services/adaptiveLearner.js';
import { VideoProcessor } from './services/videoProcessor.js';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try multiple possible locations for .env file
const possiblePaths = [
  resolve(__dirname, '../../../.env'),  // From project root (three levels up: src -> backend -> apps -> root)
  resolve(process.cwd(), '../../.env'),  // Two levels up from backend directory
  resolve(process.cwd(), '.env'),        // From current working directory
];

let envLoaded = false;
for (const envPath of possiblePaths) {
  if (existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
      console.log('✅ Loaded .env from:', envPath);
      envLoaded = true;
      break;
    }
  }
}

if (!envLoaded) {
  console.warn('⚠️  Could not find .env file. Tried:');
  possiblePaths.forEach(path => console.warn('   -', path));
  // Try loading from default location anyway (might work if file exists but path resolution is off)
  dotenv.config();
}

// Debug: Show if keys are loaded (without showing values)
const twelveLabsKey = process.env.TWELVE_LABS_API_KEY;
const amplitudeKey = process.env.AMPLITUDE_API_KEY;
const hasTwelveLabs = !!twelveLabsKey && twelveLabsKey !== 'your_twelve_labs_api_key_here' && twelveLabsKey.trim() !== '';
const hasAmplitude = !!amplitudeKey && amplitudeKey !== 'your_amplitude_api_key_here' && amplitudeKey.trim() !== '';

console.log(`   TWELVE_LABS_API_KEY: ${hasTwelveLabs ? '✅ Set' : '❌ Not set'}`);
if (twelveLabsKey) {
  console.log(`      Value preview: ${twelveLabsKey.substring(0, 10)}... (length: ${twelveLabsKey.length})`);
}
console.log(`   AMPLITUDE_API_KEY: ${hasAmplitude ? '✅ Set' : '❌ Not set'}`);
if (amplitudeKey) {
  console.log(`      Value preview: ${amplitudeKey.substring(0, 10)}... (length: ${amplitudeKey.length})`);
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Initialize services
const analytics = initializeAnalytics();
const moderationService = new ModerationService(analytics);
const adaptiveLearner = new AdaptiveLearner(analytics);
const streamProcessor = new StreamProcessor(
  moderationService,
  adaptiveLearner,
  analytics
);
const videoProcessor = new VideoProcessor(moderationService);

// Storage for video processing jobs
const videoProcessingJobs = new Map(); // videoId -> { status, result, error }

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = resolve(__dirname, '../../../uploads');
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const videoId = uuidv4();
    const ext = file.originalname.split('.').pop();
    cb(null, `${videoId}.${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|avi|mov|mkv|webm|m4v/;
    const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop());
    const mimetype = file.mimetype.startsWith('video/');
    
    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Stream management endpoints
app.post('/api/streams/start', async (req, res) => {
  try {
    const { streamId, streamerId } = req.body;
    await streamProcessor.startStream(streamId, streamerId);
    res.json({ success: true, streamId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/streams/stop', async (req, res) => {
  try {
    const { streamId } = req.body;
    await streamProcessor.stopStream(streamId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User override endpoint (for learning)
app.post('/api/moderation/override', async (req, res) => {
  try {
    const { streamId, moderationId, originalType, action } = req.body;
    const result = await adaptiveLearner.handleOverride(
      streamId,
      moderationId,
      originalType,
      action
    );
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Safety search endpoint
app.get('/api/streams/:streamId/safety-search', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { startTime, endTime, types } = req.query;
    const results = await streamProcessor.safetySearch(
      streamId,
      { startTime, endTime, types: types ? types.split(',') : undefined }
    );
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Endpoints per PRD
app.post('/api/v1/analyze/frame', async (req, res) => {
  try {
    const { frame, timestamp, user_id, stream_id } = req.body;
    const moderations = await moderationService.processVideoFrame(frame, stream_id || 'default', timestamp);
    const detections = moderations.map(m => m.detection);
    const filterInstructions = moderations.map(m => ({
      detectionId: m.id,
      action: m.type === 'blur' ? 'blur' : 'black_box',
      bbox: m.detection?.bbox,
      startTime: timestamp,
      endTime: timestamp + 5000,
      intensity: 0.8
    }));
    res.json({ detections, filter_instructions: filterInstructions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/v1/analyze/audio', async (req, res) => {
  try {
    const { audio, timestamp, user_id, stream_id } = req.body;
    const moderations = await moderationService.processAudioChunk(audio, stream_id || 'default', timestamp);
    const detections = moderations.map(m => m.detection);
    const emotionalState = moderations[0]?.detection?.tensionScore ? {
      emotion: 'frustrated',
      tensionLevel: moderations[0].detection.tensionScore,
      predictedTrajectory: moderations[0].detection.tensionScore > 0.7 ? 'escalating' : 'stable',
      profanityRisk: moderations[0].detection.tensionScore > 0.7 ? 'high' : 'low',
      suggestedFilterAdjustment: moderations[0].detection.tensionScore > 0.7 ? 1.3 : 1.0
    } : null;
    res.json({ detections, emotional_state: emotionalState });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/user/preferences', async (req, res) => {
  try {
    // In production, fetch from database
    res.json({ filters: {}, profiles: [], learned_preferences: {} });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/v1/user/preferences', async (req, res) => {
  try {
    const { filters } = req.body;
    // In production, save to database
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/v1/events/override', async (req, res) => {
  try {
    const { filter_id, override_type, user_id, stream_id } = req.body;
    const result = await adaptiveLearner.handleOverride(
      stream_id || 'default',
      filter_id,
      'unknown',
      override_type
    );
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/streamer/report/:streamId', async (req, res) => {
  try {
    const { streamId } = req.params;
    const results = await streamProcessor.safetySearch(streamId);
    const piiDetections = results
      .flatMap(r => r.moderations)
      .filter(m => m.type === 'blur')
      .map(m => m.detection);
    const nearMisses = results.map(r => ({
      timestamp: r.timestamp,
      type: r.moderations[0]?.type || 'unknown',
      confidence: r.moderations[0]?.detection?.confidence || 0
    }));
    res.json({
      stream_id: streamId,
      pii_detections: piiDetections,
      near_misses: nearMisses,
      stats: {
        total_filtered: results.length,
        leaks_prevented: piiDetections.length,
        average_confidence: piiDetections.length > 0
          ? piiDetections.reduce((sum, d) => sum + (d.confidence || 0), 0) / piiDetections.length
          : 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Video Upload and Censoring Endpoints
app.post('/api/v1/video/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const videoId = req.file.filename.split('.')[0]; // Extract ID from filename
    const inputPath = req.file.path;

    // Initialize processing job
    videoProcessingJobs.set(videoId, {
      status: 'uploaded',
      videoId,
      originalFilename: req.file.originalname,
      uploadedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      videoId,
      message: 'Video uploaded successfully. Start processing to censor profanities.',
      uploadPath: inputPath
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process uploaded video (censor profanities)
app.post('/api/v1/video/process/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    // Find uploaded video file
    const uploadsDir = resolve(__dirname, '../../../uploads');
    const uploadedFiles = await import('fs').then(fs => 
      fs.promises.readdir(uploadsDir)
    );
    const videoFile = uploadedFiles.find(f => f.startsWith(videoId));
    
    if (!videoFile) {
      return res.status(404).json({ error: 'Video not found. Please upload first.' });
    }

    const inputPath = join(uploadsDir, videoFile);
    const job = videoProcessingJobs.get(videoId) || { status: 'pending' };
    
    if (job.status === 'processing') {
      return res.status(400).json({ error: 'Video is already being processed' });
    }

    if (job.status === 'completed') {
      return res.json({
        success: true,
        message: 'Video already processed',
        result: job.result
      });
    }

    // Update job status
    job.status = 'processing';
    job.startedAt = new Date().toISOString();
    videoProcessingJobs.set(videoId, job);

    // Process video asynchronously
    videoProcessor.processVideo(inputPath, videoId)
      .then(result => {
        job.status = 'completed';
        job.result = result;
        job.completedAt = new Date().toISOString();
        videoProcessingJobs.set(videoId, job);
        console.log(`✅ Video ${videoId} processing completed`);
      })
      .catch(error => {
        job.status = 'failed';
        job.error = error.message;
        job.failedAt = new Date().toISOString();
        videoProcessingJobs.set(videoId, job);
        console.error(`❌ Video ${videoId} processing failed:`, error);
      });

    res.json({
      success: true,
      videoId,
      status: 'processing',
      message: 'Video processing started. Check status endpoint for progress.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get video processing status
app.get('/api/v1/video/status/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const job = videoProcessingJobs.get(videoId);

    if (!job) {
      return res.status(404).json({ error: 'Video processing job not found' });
    }

    res.json({
      videoId,
      status: job.status,
      uploadedAt: job.uploadedAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      failedAt: job.failedAt,
      result: job.result || null,
      error: job.error || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download censored video
app.get('/api/v1/video/download/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const job = videoProcessingJobs.get(videoId);

    if (!job || job.status !== 'completed') {
      return res.status(404).json({ 
        error: job?.status === 'processing' 
          ? 'Video is still being processed' 
          : 'Video not found or not processed yet' 
      });
    }

    const outputPath = job.result.outputPath;
    
    if (!existsSync(outputPath)) {
      return res.status(404).json({ error: 'Processed video file not found' });
    }

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="censored_${videoId}.mp4"`);
    
    const { createReadStream } = await import('fs');
    const videoStream = createReadStream(outputPath);
    videoStream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket connection for real-time streaming
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-stream', async ({ streamId, platform, userId }) => {
    socket.join(`stream:${streamId}`);
    await streamProcessor.addViewer(streamId, socket.id);
    if (!streamProcessor.activeStreams.has(streamId)) {
      await streamProcessor.startStream(streamId, userId || 'unknown');
    }
  });

  socket.on('leave-stream', async ({ streamId }) => {
    socket.leave(`stream:${streamId}`);
    await streamProcessor.removeViewer(streamId, socket.id);
  });

  socket.on('frame_analysis', async (data) => {
    const { frame, timestamp, userId, streamId } = data;
    const result = await streamProcessor.processStreamChunk(
      streamId,
      { videoFrame: frame, timestamp },
      socket.id
    );
    
    // Send filter instructions back
    if (result && result.moderations) {
      const instructions = result.moderations.map(m => ({
        detectionId: m.id,
        action: m.type === 'blur' ? 'blur' : 'black_box',
        bbox: m.detection?.bbox,
        startTime: timestamp,
        endTime: timestamp + 5000,
        intensity: 0.8
      }));
      socket.emit('filter_instruction', instructions[0]); // Send first instruction
    }
  });

  socket.on('audio_analysis', async (data) => {
    const { audio, timestamp, userId, streamId } = data;
    await streamProcessor.processStreamChunk(
      streamId,
      { audioChunk: audio, timestamp },
      socket.id
    );
  });

  socket.on('filter_override', async (data) => {
    const { detectionId, overrideType, userId, streamId } = data;
    const result = await adaptiveLearner.handleOverride(
      streamId,
      detectionId,
      'unknown',
      overrideType
    );
    
    // If sensitivity was adjusted, notify client
    if (result.sensitivityAdjusted) {
      socket.emit('sensitivity_adjusted', {
        category: result.category,
        oldThreshold: result.oldThreshold,
        newThreshold: result.newThreshold,
        notification: result.notification
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Sentinella backend running on port ${PORT}`);
  console.log(`📊 Analytics: ${analytics ? 'Initialized' : 'Not configured'}`);
});
