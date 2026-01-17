-- Sentinella Database Schema
-- PostgreSQL schema for user preferences, learned preferences, and detection logs

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('viewer', 'streamer', 'moderator')),
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User preferences (filter settings)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  profile_name VARCHAR(100) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  lock_pin_hash VARCHAR(255),
  filters JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Learned preferences (AI learning)
CREATE TABLE IF NOT EXISTS learned_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  filter_category VARCHAR(50) NOT NULL,
  filter_subcategory VARCHAR(50),
  original_threshold FLOAT NOT NULL,
  learned_threshold FLOAT NOT NULL,
  confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  override_count INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, filter_category, filter_subcategory)
);

-- Streamer whitelist
CREATE TABLE IF NOT EXISTS streamer_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  pii_type VARCHAR(50) NOT NULL,
  value_hash VARCHAR(255) NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Detection log (for analytics and debugging)
CREATE TABLE IF NOT EXISTS detection_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  detection_type VARCHAR(50) NOT NULL,
  confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  model_used VARCHAR(50) NOT NULL,
  was_filtered BOOLEAN DEFAULT true,
  was_overridden BOOLEAN DEFAULT false,
  stream_id VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_learned_preferences_user_id ON learned_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_streamer_whitelist_user_id ON streamer_whitelist(user_id);
CREATE INDEX IF NOT EXISTS idx_detection_log_user_id ON detection_log(user_id);
CREATE INDEX IF NOT EXISTS idx_detection_log_timestamp ON detection_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_detection_log_stream_id ON detection_log(stream_id);
