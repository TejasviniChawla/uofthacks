# Sentinella - Hackathon Demo Guide

## 🎯 Demo Flow (5-7 minutes)

### 1. Setup (1 min)
- Show extension installed in Chrome
- Show backend running (`npm run dev:backend`)
- Show streamer dashboard (`npm run dev:dashboard`)

### 2. Viewer Extension Demo (2-3 min)

**Show Extension Popup:**
- Open extension popup
- Show filter sliders (Profanity, Violence, Jumpscares, etc.)
- Show "AI Learning" tab with learned preferences
- Show "Stats" tab with session statistics

**Live Demo on Twitch/YouTube:**
- Navigate to a live stream
- Show extension detecting and filtering content
- Override a filter multiple times (click "Reveal" button)
- Show AI learning notification appearing
- Show sensitivity auto-adjustment

**Key Points:**
- "5-second buffer means we analyze content BEFORE it appears"
- "AI learns from your overrides - watch the sensitivity adjust"
- "Personalized experience - different filters for different needs"

### 3. Streamer Dashboard Demo (1-2 min)

**Show Dashboard:**
- Stream status (Protected/Active)
- PII detection log (credit cards, addresses auto-blurred)
- Tension meter (shows emotional trajectory)
- AI Insights panel (shows automatic adjustments)

**Key Points:**
- "PII is detected and blurred automatically"
- "Emotional trajectory prediction - filters get more aggressive when tension rises"
- "Post-stream reports show all near-misses"

### 4. Twelve Labs Integration (1 min)

**Show API Usage:**
- Open backend logs showing Marengo calls
- Show Pegasus emotional analysis
- Demonstrate predictive detection (not just keyword matching)

**Key Points:**
- "Marengo detects visual PII that humans might miss"
- "Pegasus understands context - predicts violations before they happen"
- "Not just keyword matching - semantic understanding"

### 5. Amplitude Integration (1 min)

**Show Event Tracking:**
- Open Amplitude dashboard (if available)
- Show event flow: `filter_triggered` → `filter_override` → `sensitivity_auto_adjusted`
- Show cohort analysis (users who override vs. don't)

**Key Points:**
- "Every interaction is tracked"
- "Data drives the learning - see the complete loop"
- "Self-improving system based on behavioral data"

## 🎬 Talking Points

### Problem
"Current moderation is reactive - it happens after the damage is done. A streamer accidentally shows their address, and it's already broadcast to thousands of viewers."

### Solution
"Sentinella uses a 5-second buffer to analyze content BEFORE it reaches viewers. We can detect PII, predict profanity, and filter unwanted content proactively."

### Innovation
"Unlike keyword-based filters, we use Twelve Labs' semantic understanding to predict violations based on context. And with Amplitude, the system learns from user behavior to personalize the experience."

### Impact
"For viewers: Control your own experience. For streamers: Protect yourself from accidental leaks. For platforms: Better content safety without manual moderation."

## 🔧 Technical Highlights to Mention

1. **Real-time Processing Pipeline**
   - Frame capture every 200ms
   - 5-second buffer for analysis
   - WebSocket for real-time communication

2. **AI Learning Loop**
   - Track overrides → Detect patterns → Adjust sensitivity → Notify user
   - Visible in UI with confidence scores

3. **Predictive Moderation**
   - Emotional trajectory analysis
   - Context-aware detection
   - Not just keyword matching

4. **Scalable Architecture**
   - Monorepo structure
   - Shared types package
   - Modular services

## 🐛 Known Limitations (Be Honest)

- Mock mode if API keys not configured (still shows flow)
- Audio filtering is simplified (visual blur works fully)
- Database integration is optional for MVP
- Extension needs to be built before loading

## 💡 Future Enhancements (If Asked)

- Firefox extension
- Mobile app
- OBS plugin for streamers
- Multi-language support
- Custom filter training

## 🎯 Closing Statement

"Sentinella demonstrates how AI can be used proactively, not reactively. By combining Twelve Labs' semantic understanding with Amplitude's behavioral insights, we've created a self-improving safety system that puts control back in the hands of users."

---

**Remember:** The demo should feel smooth and show the "wow factor" - predictive moderation that learns and adapts!
