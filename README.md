# Sentinella - Pre-Cognitive Content Safety Platform

> **Viewer-First AI-Powered Content Safety for Live Streaming**

Sentinella is a pre-cognitive content safety layer that predicts and filters unwanted content **BEFORE** it reaches the viewer's screen. Unlike reactive moderation, we use a 5-10 second buffer to "see the future" and apply personalized filters.

## 🎯 Key Features

### For Viewers (Browser Extension)
- **5-Second Safety Buffer**: Content is analyzed and filtered before it appears
- **Personalized Filters**: Control profanity, violence, jumpscares, flashing lights, and more
- **AI Learning**: System learns from your overrides and adjusts sensitivity automatically
- **Real-time Warnings**: Get 3-5 second advance notice before intense content
- **Override Control**: Click to reveal filtered content anytime
- **Multiple Profiles**: Switch between "Gaming", "Family-Friendly", "Maximum Safety" presets

### For Streamers (Dashboard)
- **PII Auto-Detection**: Automatically blurs credit cards, addresses, phone numbers, emails
- **Emotional Trajectory Prediction**: Detects rising tension and increases filter sensitivity
- **Post-Stream Safety Reports**: Review all near-miss moments
- **Whitelist Management**: Allow specific safe elements (business email, P.O. Box)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VIEWER EXTENSION                          │
│  (Chrome/Firefox) - Intercepts video, applies filters       │
└───────────────────────┬─────────────────────────────────────┘
                        │ WebSocket
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND API                            │
│  • WebSocket Server (Socket.io)                             │
│  • Twelve Labs Integration (Marengo + Pegasus)              │
│  • Amplitude Analytics                                       │
│  • Adaptive Learning Engine                                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  STREAMER DASHBOARD                          │
│  (Next.js) - Real-time PII detection, tension monitoring    │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- FFmpeg (for video upload/censoring feature)
- Twelve Labs API Key
- Amplitude API Key (optional for demo)

> **Note**: FFmpeg is required for video upload/censoring. If not installed, use `winget install --id=Gyan.FFmpeg -e` (Windows) or install via your package manager.

### Installation

```bash
# Clone repository
cd Sentinella

# Install all dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your API keys
# TWELVE_LABS_API_KEY=your_key_here
# AMPLITUDE_API_KEY=your_key_here
```

### Development

```bash
# Start backend server
npm run dev:backend

# In another terminal, start extension build (watch mode)
npm run dev:extension

# In another terminal, start streamer dashboard
npm run dev:dashboard
```

### Load Extension

1. Build the extension:
   ```bash
   cd apps/extension
   npm run build
   ```

2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select `apps/extension/dist` folder

6. Visit Twitch or YouTube and the extension will activate automatically

### Video Upload & Profanity Censoring

Upload videos to automatically detect and censor profanities:

```bash
# 1. Upload a video file
curl -X POST -F "video=@your-video.mp4" http://localhost:3001/api/v1/video/upload
# Response: { "videoId": "abc-123-...", ... }

# 2. Process the video (detects profanities, applies censoring)
curl -X POST http://localhost:3001/api/v1/video/process/abc-123-...

# 3. Check processing status
curl http://localhost:3001/api/v1/video/status/abc-123-...

# 4. Download the censored video
curl -O http://localhost:3001/api/v1/video/download/abc-123-...
```

The system will:
- Analyze video frames for visual profanity/PII (using Twelve Labs Marengo)
- Analyze audio for profanity (using Twelve Labs Pegasus)
- Apply blur to visual profanity and mute audio profanity
- Return a censored video file

## 📁 Project Structure

```
sentinella/
├── apps/
│   ├── extension/          # Browser Extension (PRIMARY)
│   │   ├── src/
│   │   │   ├── background/ # Service Worker
│   │   │   ├── content/    # Content Scripts (Video Interception)
│   │   │   ├── popup/      # React Popup UI
│   │   │   └── lib/        # WebSocket, Amplitude clients
│   │   └── manifest.json
│   │
│   ├── dashboard/          # Streamer Dashboard (SECONDARY)
│   │   └── src/
│   │       ├── app/         # Next.js App Router
│   │       └── components/ # Dashboard Components
│   │
│   └── backend/            # Backend API
│       └── src/
│           ├── services/   # Twelve Labs, Moderation, Learning
│           ├── analytics/  # Amplitude integration
│           └── index.js    # Express + WebSocket server
│
└── packages/
    └── shared/             # Shared TypeScript types
```

## 🎯 Hackathon Demo Flow

### Twelve Labs Track
1. **Show Predictive Moderation**: Extension detects profanity BEFORE it's heard
2. **Visual PII Detection**: Auto-blur credit cards/addresses in real-time
3. **Emotional Trajectory**: Show tension meter rising, filters auto-adjusting
4. **Post-Stream Search**: Use Twelve Labs search to find near-misses

### Amplitude Track
1. **Event Flow**: Show complete event tracking in Amplitude dashboard
2. **Sensitivity Auto-Adjustment**: Override filter 5 times → AI reduces sensitivity → Notification appears
3. **AI Learning Panel**: Show visible UI with learned preferences
4. **Cohort Analysis**: Compare users who override vs. don't

## 🔧 Technology Stack

- **Frontend (Extension)**: React 18 + TypeScript + TailwindCSS
- **Backend**: Node.js + Express + Socket.io
- **Dashboard**: Next.js 14 (App Router)
- **AI/ML**: Twelve Labs (Marengo + Pegasus)
- **Analytics**: Amplitude
- **Database**: PostgreSQL (schema provided, optional for MVP)

## 📊 API Endpoints

### Viewer Extension
- `POST /api/v1/analyze/frame` - Analyze video frame
- `POST /api/v1/analyze/audio` - Analyze audio chunk
- `GET /api/v1/user/preferences` - Get user filter settings
- `PUT /api/v1/user/preferences` - Update filter settings
- `POST /api/v1/events/override` - Track filter override

### Streamer Dashboard
- `GET /api/v1/streamer/report/:streamId` - Get post-stream safety report

### Video Upload & Censoring
- `POST /api/v1/video/upload` - Upload a video file for processing
- `POST /api/v1/video/process/:videoId` - Process uploaded video (detect and censor profanities)
- `GET /api/v1/video/status/:videoId` - Check processing status
- `GET /api/v1/video/download/:videoId` - Download censored video

### WebSocket Events
- `join-stream` - Join a stream session
- `frame_analysis` - Send frame for analysis
- `audio_analysis` - Send audio for analysis
- `filter_instruction` - Receive filter instructions
- `filter_override` - Override a filter
- `sensitivity_adjusted` - Receive sensitivity adjustment notification

## 🧠 AI Learning System

The adaptive learning system tracks user overrides and automatically adjusts filter sensitivity:

1. **User Action**: Viewer overrides "violence-cartoon" filter 5 times
2. **Pattern Detection**: System detects consistent override pattern
3. **Recommendation**: AI suggests reducing sensitivity by 20%
4. **User Notification**: Toast appears: "🧠 Sentinella noticed you often allow cartoon violence. Sensitivity has been reduced."
5. **Confirmation**: User can accept or reject the change

## 📝 Environment Variables

See `.env.example` for all required environment variables.

## 🎨 UI/UX Highlights

- **Non-intrusive**: Filters apply seamlessly without breaking viewing experience
- **Transparent**: Users see exactly what's being filtered and why
- **Control**: Easy override with one click
- **Learning**: Visible AI learning status panel
- **Stats**: Real-time session statistics

## 🏆 Hackathon Winning Criteria

### Twelve Labs Track
✅ **Twelve Labs API Use**: Marengo for visual PII, Pegasus for audio + emotional trajectory  
✅ **Impact & Usefulness**: Real-world use case protecting streamers & viewers  
✅ **Wow Factor**: PREDICTIVE moderation - filter BEFORE content appears  
✅ **Technical Depth**: Real-time processing pipeline, emotional trajectory prediction  
✅ **UX Quality**: Clean extension popup, intuitive overlays

### Amplitude Track
✅ **Behavioral Data**: Comprehensive event schema tracking all interactions  
✅ **AI Application**: Self-improving sensitivity based on override patterns  
✅ **Product Impact**: Personalized viewing experience that learns preferences  
✅ **Innovation**: Perfect "data → insights → action" loop demonstration  
✅ **Execution**: Visible UI showing AI learning in real-time

## 📄 License

MIT

## 🙏 Acknowledgments

Built for hackathon with:
- **Twelve Labs** - Video and audio understanding
- **Amplitude** - Behavioral analytics and insights

---

**Made with ❤️ for safer streaming**
