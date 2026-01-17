import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import 'dotenv/config';

import { analyzeRouter } from './routes/analyze.js';
import { preferencesRouter } from './routes/preferences.js';
import { eventsRouter } from './routes/events.js';
import { streamerRouter } from './routes/streamer.js';
import { handleWebSocketConnection } from './websocket/handler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'chrome-extension://*'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/analyze', analyzeRouter);
app.use('/api/v1/preferences', preferencesRouter);
app.use('/api/v1/events', eventsRouter);
app.use('/api/v1/streamer', streamerRouter);

// Create HTTP server
const server = createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server, path: '/ws/realtime' });

wss.on('connection', handleWebSocketConnection);

// Start server
server.listen(PORT, () => {
  console.log(`🛡️  Sentinella Backend running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket available at ws://localhost:${PORT}/ws/realtime`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  wss.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

