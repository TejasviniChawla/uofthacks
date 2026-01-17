# 🛡️ Sentinella

## Pre-Cognitive Content Safety Platform for Live Streaming

Sentinella is a viewer-controlled, AI-powered content safety layer that **predicts and filters unwanted content BEFORE it reaches the viewer's screen**. Unlike reactive moderation, we use a 5-10 second buffer to "see the future" and apply personalized filters.

![Sentinella Banner](https://via.placeholder.com/800x400/0f172a/22c55e?text=SENTINELLA)

### 🎯 The Problem

- **Viewers** can't control what content they're exposed to on live streams
- **Parents** can't always monitor what their kids are watching
- **Streamers** accidentally leak PII (addresses, credit cards, emails)
- **Accessibility users** (epilepsy, PTSD) have no advance warning for triggering content

### 💡 Our Solution

**Predictive Content Moderation** - We buffer the stream and analyze it BEFORE it reaches viewers, giving them time to prepare or filter content.

## ✨ Features

### For Viewers (Browser Extension)
- 🎛️ **Customizable Filters** - Profanity, violence, jumpscares, flashing lights, and more
- ⚠️ **Early Warnings** - Get 3-5 second warnings before filtered content appears
- 👁️ **Override Control** - Click to reveal filtered content if you want to see it
- 🧠 **AI Learning** - Sentinella learns your preferences from your overrides
- 👨‍👩‍👧 **Multiple Profiles** - "Just Me", "Kids Watching", "Late Night" modes

### For Streamers (Dashboard)
- 🔒 **PII Auto-Detection** - Credit cards, addresses, emails auto-blurred before broadcast
- 📊 **Tension Meter** - AI detects when you're frustrated and increases filter sensitivity
- ✅ **Whitelist Management** - Allow your business email, P.O. Box, etc.
- 📋 **Post-Stream Reports** - See all near-misses and get improvement recommendations

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       VIEWER SIDE                                │
├─────────────────────────────────────────────────────────────────┤
│  Browser Extension → 5-Second Buffer → Filter Application       │
│         ↓                                                        │
│    WebSocket Connection                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
├─────────────────────────────────────────────────────────────────┤
│  Express API → AI Processing → User Preferences                 │
│       ↓              ↓                                           │
│  WebSocket     ┌─────────────┐    ┌─────────────┐               │
│    Server      │ TWELVE LABS │    │  AMPLITUDE  │               │
│                │   Marengo   │    │  Analytics  │               │
│                │   Pegasus   │    │             │               │
│                └─────────────┘    └─────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Extension** | React 18, TypeScript, Vite, TailwindCSS |
| **Dashboard** | Next.js 14, React, TailwindCSS, Recharts |
| **Backend** | Node.js, Express, WebSocket, TypeScript |
| **AI** | Twelve Labs Marengo (Video) + Pegasus (Audio) |
| **Analytics** | Amplitude (Self-improving loop) |
| **Monorepo** | Turborepo |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 10+

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/sentinella.git
cd sentinella

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys
```

### Development

```bash
# Start all services
npm run dev

# Or start individually:
npm run dev:backend    # Backend API (port 3001)
npm run dev:dashboard  # Streamer Dashboard (port 3000)
npm run dev:extension  # Extension build watch
```

### Build Extension

```bash
cd apps/extension
npm run build
# Load unpacked extension from apps/extension/dist
```

## 📁 Project Structure

```
sentinella/
├── apps/
│   ├── extension/          # Chrome Extension
│   │   ├── src/
│   │   │   ├── popup/      # React popup UI
│   │   │   ├── content/    # Content scripts
│   │   │   ├── background/ # Service worker
│   │   │   └── lib/        # Shared utilities
│   │   └── manifest.json
│   │
│   ├── dashboard/          # Next.js Streamer Dashboard
│   │   └── src/
│   │       ├── app/        # App router pages
│   │       ├── components/ # React components
│   │       └── lib/        # API utilities
│   │
│   └── backend/            # Express + WebSocket API
│       └── src/
│           ├── routes/     # API endpoints
│           ├── services/   # Business logic
│           ├── websocket/  # Real-time handling
│           └── db/         # Data stores
│
└── packages/
    └── shared/             # Shared types & constants
```

## 🔑 Environment Variables

```env
# Backend
TWELVE_LABS_API_KEY=your_api_key
AMPLITUDE_API_KEY=your_api_key
PORT=3001

# Extension & Dashboard
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🎬 Demo Flow

1. **Open Twitch/YouTube** with the extension installed
2. **See the indicator** showing Sentinella is active
3. **Content gets analyzed** in the 5-second buffer
4. **Warning appears** 3-5 seconds before filtered content
5. **Choose to reveal or keep filtered**
6. **Watch AI learn** from your overrides
7. **Get notified** when Sentinella adjusts your preferences

## 🏆 Hackathon Tracks

### Twelve Labs Track
- **Marengo**: Visual PII detection, content moderation, scene analysis
- **Pegasus**: Audio analysis, emotional trajectory, profanity detection
- **Search**: Post-stream safety analysis for near-misses

### Amplitude Track
- **Self-Improving Loop**: Override tracking → Pattern detection → Sensitivity adjustment
- **Visible AI Learning**: Real-time UI showing what the AI learned
- **Complete Event Schema**: 15+ event types tracking all user interactions

## 📊 Amplitude Event Flow

```
User overrides "cartoon violence" 5 times
        ↓
amplitude.track('filter_override', {...})
        ↓
System detects pattern (83% override rate)
        ↓
amplitude.track('override_pattern_detected', {...})
        ↓
AI generates recommendation
        ↓
Toast: "🧠 Reduced cartoon violence filtering"
        ↓
amplitude.track('sensitivity_auto_adjusted', {...})
        ↓
User accepts/rejects
        ↓
amplitude.track('sensitivity_adjustment_response', {...})
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with ❤️ for UofT Hacks


