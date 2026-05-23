-- Saathi Voice Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(255),
    current_role VARCHAR(50), -- 'daughter', 'son', 'husband', 'wife', etc.
    language_mix VARCHAR(10) DEFAULT 'hi-en', -- 'hi-en', 'en', 'es-en', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    conversation_id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(user_id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- which role AI was playing
    messages JSONB NOT NULL, -- [{speaker: 'user'|'ai', text: '...', timestamp: '...'}]
    mood_detected VARCHAR(50), -- 'sad', 'happy', 'anxious', 'lonely', 'playful'
    topics TEXT[], -- ['family', 'health', 'work']
    duration_seconds INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Memory context table (for long-term memory)
CREATE TABLE IF NOT EXISTS memory_context (
    user_id VARCHAR(255) PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    summary TEXT, -- "User misses daughter in Mumbai, recently had fight with husband"
    key_details JSONB, -- {family: {daughter: 'Mumbai', son: 'Delhi'}, interests: ['cooking']}
    last_topics TEXT[],
    last_mood VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crisis alerts table (for safety monitoring)
CREATE TABLE IF NOT EXISTS crisis_alerts (
    alert_id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(user_id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    severity VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    ai_response TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_user_id ON crisis_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_severity ON crisis_alerts(severity);

-- Sample data for testing
INSERT INTO users (user_id, name, phone, current_role, language_mix) 
VALUES 
    ('test-user-1', 'Rajesh Kumar', '+919876543210', 'daughter', 'hi-en'),
    ('test-user-2', 'Priya Sharma', '+919876543211', 'son', 'hi-en')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO memory_context (user_id, summary, key_details, last_topics, last_mood)
VALUES
    ('test-user-1', 
     'User feels lonely, misses daughter who lives in Mumbai. Had recent argument with wife.', 
     '{"family": {"daughter": "Mumbai", "wife": "home"}, "interests": ["reading", "gardening"]}',
     ARRAY['family', 'loneliness'],
     'sad'),
    ('test-user-2',
     'User is happy today, son called in the morning.',
     '{"family": {"son": "Delhi", "grandson": "5 years old"}}',
     ARRAY['family', 'grandchildren'],
     'happy')
ON CONFLICT (user_id) DO NOTHING;
