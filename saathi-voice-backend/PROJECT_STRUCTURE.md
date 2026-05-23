# Project Structure 📁

Complete overview of the Saathi Voice backend codebase.

```
saathi-voice-backend/
│
├── config/                          # Configuration files
│   ├── database.js                  # PostgreSQL connection & query helpers
│   └── personalities.js             # Role personalities & crisis detection
│
├── controllers/                     # Request handlers
│   ├── conversationController.js   # Voice/text chat endpoints
│   └── userController.js           # User management endpoints
│
├── database/                        # Database files
│   └── schema.sql                  # PostgreSQL schema & sample data
│
├── routes/                         # API route definitions
│   └── api.js                      # All API endpoints
│
├── services/                       # Business logic
│   ├── aiService.js               # Claude API integration
│   ├── memoryService.js           # Conversation memory & storage
│   └── speechService.js           # Whisper & ElevenLabs integration
│
├── temp/                           # Temporary audio files (created at runtime)
│
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore rules
├── DEPLOYMENT.md                   # Deployment guide
├── FRONTEND_INTEGRATION.md         # Frontend integration guide
├── package.json                    # Node.js dependencies
├── README.md                       # Main documentation
├── server.js                       # Express server entry point
└── test-api.js                     # API testing script
```

---

## File Descriptions

### Core Application Files

#### `server.js`
**Main application entry point**
- Initializes Express server
- Sets up middleware (CORS, JSON parsing, etc.)
- Mounts API routes
- Error handling
- Database connection verification
- Graceful shutdown handlers

**Key responsibilities:**
- Server configuration
- Request logging
- Global error handling
- Health check endpoint

---

#### `routes/api.js`
**API route definitions**
- Maps HTTP endpoints to controller functions
- Configures Multer for file uploads
- Defines all API routes

**Endpoints defined:**
- `GET /api/health` - Health check
- `POST /api/users` - Create user
- `GET /api/users/:userId` - Get user
- `POST /api/users/select-role` - Select conversation role
- `GET /api/roles` - Get available roles
- `POST /api/conversation/voice` - Voice input
- `POST /api/conversation/text` - Text input
- `GET /api/conversation/history/:userId` - Get chat history
- `GET /api/conversation/memory/:userId` - Get memory summary

---

### Configuration

#### `config/database.js`
**Database connection management**
- PostgreSQL connection pool
- Query execution helper
- Transaction helper
- Connection error handling
- Query logging

**Key functions:**
- `query(text, params)` - Execute SQL query
- `transaction(callback)` - Execute transaction
- `pool` - Connection pool export

---

#### `config/personalities.js`
**Role personality definitions**
- System prompts for each role (daughter, son, etc.)
- Voice ID mappings
- Crisis keyword detection
- Crisis response templates

**Exports:**
- `rolePersonalities` - 9 role configurations
- `crisisKeywords` - Multilingual crisis detection
- `detectCrisisLevel(text)` - Returns crisis severity
- `crisisResponse` - Crisis response templates

---

### Controllers

#### `controllers/userController.js`
**User management logic**
- Create/retrieve users
- Role selection
- User preferences
- Get available roles

**Methods:**
- `createUser(req, res)` - POST /api/users
- `getUser(req, res)` - GET /api/users/:userId
- `selectRole(req, res)` - POST /api/users/select-role
- `getAvailableRoles(req, res)` - GET /api/roles
- `updatePreferences(req, res)` - PUT /api/users/:userId/preferences

---

#### `controllers/conversationController.js`
**Conversation handling logic**
- Voice message pipeline
- Text message handling
- History retrieval
- Memory management

**Methods:**
- `handleVoiceInput(req, res)` - Full voice pipeline
- `handleTextInput(req, res)` - Text conversation
- `getHistory(req, res)` - Conversation history
- `getMemorySummary(req, res)` - User memory context
- `extractTopics(message)` - Helper for topic extraction

**Voice Pipeline Flow:**
1. Receive audio file
2. Get user role and language
3. Transcribe audio (Whisper)
4. Get memory context
5. Generate AI response (Claude)
6. Convert to speech (ElevenLabs)
7. Save conversation
8. Return audio response

---

### Services

#### `services/aiService.js`
**Claude API integration**
- Generate conversational responses
- Inject role personality
- Memory context integration
- Crisis detection
- Mood detection

**Key methods:**
- `generateResponse({ userMessage, role, memoryContext, languageMix })`
- `buildSystemPrompt(personality, memoryContext, languageMix)`
- `detectMood(message)` - Returns mood (sad, happy, etc.)

**Response format:**
```javascript
{
  text: "AI response text",
  crisisLevel: "high|medium|low|null",
  mood: "sad|happy|anxious|etc"
}
```

---

#### `services/speechService.js`
**Voice processing**
- Audio transcription (OpenAI Whisper)
- Text-to-speech (ElevenLabs)
- Audio file management

**Key methods:**
- `transcribeAudio(audioBuffer, filename)` - Returns transcript text
- `synthesizeSpeech(text, role)` - Returns audio buffer
- `saveAudioFile(buffer, filename)` - Save to disk (optional)

**Supported formats:**
- Input: webm, mp3, wav, m4a
- Output: mp3 (from ElevenLabs)

---

#### `services/memoryService.js`
**Conversation memory & persistence**
- Store/retrieve conversation history
- Maintain user context
- Update memory summaries
- Crisis alert logging

**Key methods:**
- `getMemoryContext(userId)` - Returns formatted memory for AI
- `updateMemoryContext(userId, conversationData)` - Updates after chat
- `saveConversation(userId, data)` - Stores conversation
- `getRecentConversations(userId, limit)` - Returns history
- `logCrisisAlert(userId, message, severity, response)` - Logs alerts

**Memory format:**
```javascript
{
  summary: "User misses daughter in Mumbai...",
  key_details: { family: {...}, interests: [...] },
  last_topics: ["family", "loneliness"],
  last_mood: "sad"
}
```

---

### Database

#### `database/schema.sql`
**PostgreSQL database schema**

**Tables:**

1. **users**
   - `user_id` (PK) - Unique user identifier
   - `name` - User's name
   - `phone` - Phone number
   - `current_role` - Selected conversation role
   - `language_mix` - Language preference (hi-en, en, etc.)
   - `created_at` - Account creation timestamp

2. **conversations**
   - `conversation_id` (PK) - Auto-increment ID
   - `user_id` (FK) - References users
   - `role` - Which role AI was playing
   - `messages` - JSONB array of messages
   - `mood_detected` - Detected mood
   - `topics` - Array of topics
   - `created_at` - Conversation timestamp

3. **memory_context**
   - `user_id` (PK) - References users
   - `summary` - Text summary of user context
   - `key_details` - JSONB structured details
   - `last_topics` - Recent conversation topics
   - `last_mood` - Last detected mood
   - `updated_at` - Last update timestamp

4. **crisis_alerts**
   - `alert_id` (PK) - Auto-increment ID
   - `user_id` (FK) - References users
   - `message_text` - User's message
   - `severity` - low/medium/high
   - `ai_response` - How AI responded
   - `resolved` - Boolean flag
   - `created_at` - Alert timestamp

**Indexes:**
- Conversations by user_id and created_at (for fast history queries)
- Crisis alerts by user_id and severity (for monitoring)

---

### Documentation Files

#### `README.md`
**Main project documentation**
- Features overview
- Installation instructions
- API endpoint reference
- Testing guide
- Example usage
- Ethical considerations

#### `DEPLOYMENT.md`
**Deployment guide**
- Railway deployment
- Render deployment
- AWS EC2 + RDS deployment
- DigitalOcean deployment
- Post-deployment checklist
- Monitoring setup
- Troubleshooting

#### `FRONTEND_INTEGRATION.md`
**Frontend integration examples**
- React web app example
- React Native mobile app example
- API service setup
- Voice recording implementation
- Error handling
- Testing strategies

---

### Testing

#### `test-api.js`
**API testing script**
- Health check test
- User creation test
- Role selection test
- Text conversation test
- History retrieval test
- Memory summary test

**Run:** `node test-api.js`

---

## Data Flow

### Voice Message Flow
```
User speaks into microphone
    ↓
Frontend: Record audio → Send to /api/conversation/voice
    ↓
Backend: Receive audio file
    ↓
speechService: Whisper API → Transcribe to text
    ↓
memoryService: Get user context from database
    ↓
aiService: Claude API → Generate response
    ↓
speechService: ElevenLabs → Convert text to speech
    ↓
memoryService: Save conversation to database
    ↓
Backend: Return audio file to frontend
    ↓
Frontend: Play audio response to user
```

### Text Message Flow
```
User types message → Send to /api/conversation/text
    ↓
Backend: Receive text message
    ↓
memoryService: Get user context
    ↓
aiService: Claude API → Generate response
    ↓
memoryService: Save conversation
    ↓
Backend: Return text response
    ↓
Frontend: Display response
```

---

## Environment Variables

### Required API Keys
- `ANTHROPIC_API_KEY` - Claude API
- `OPENAI_API_KEY` - Whisper API
- `ELEVENLABS_API_KEY` - Text-to-speech

### Database Configuration
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port (5432)
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password

### Voice IDs (ElevenLabs)
- `VOICE_ID_DAUGHTER` - Female voice for daughter role
- `VOICE_ID_SON` - Male voice for son role
- `VOICE_ID_MOTHER` - Female voice for mother role
- `VOICE_ID_FATHER` - Male voice for father role
- `VOICE_ID_HUSBAND` - Male voice for husband role
- `VOICE_ID_WIFE` - Female voice for wife role
- `VOICE_ID_FRIEND` - Neutral voice for friend role
- `VOICE_ID_GRANDFATHER` - Older male voice
- `VOICE_ID_GRANDMOTHER` - Older female voice

### Server Configuration
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `ALLOWED_ORIGINS` - CORS allowed origins

---

## API Design Principles

1. **RESTful conventions** - Standard HTTP methods and status codes
2. **Clear error messages** - Helpful error responses
3. **Metadata in headers** - Voice responses include transcript/mood in headers
4. **Idempotency** - Safe to retry requests
5. **Validation** - Input validation before processing
6. **Async/await** - Modern async patterns throughout
7. **Logging** - Console logs for debugging
8. **Security** - Parameterized queries, CORS, file type validation

---

## Extension Points

### Adding a New Role

1. Add to `config/personalities.js`:
```javascript
newRole: {
  systemPrompt: "Your prompt here...",
  voiceId: process.env.VOICE_ID_NEW_ROLE,
  emotionalTone: "description"
}
```

2. Add environment variable:
```env
VOICE_ID_NEW_ROLE=elevenlabs_voice_id
```

3. No code changes needed - automatically available!

### Adding a New Language

1. Update `aiService.js` → `getLanguageInstruction()`:
```javascript
'fr-en': 'Mix French and English naturally...'
```

2. Update personality prompts if needed

### Adding Analytics

Add middleware in `server.js`:
```javascript
app.use((req, res, next) => {
  // Log to analytics service
  analytics.track({
    event: 'api_request',
    endpoint: req.path,
    method: req.method
  });
  next();
});
```

---

## Performance Characteristics

### Response Times (typical)
- Health check: <10ms
- Text conversation: 2-4 seconds
- Voice conversation: 8-15 seconds
  - Whisper transcription: ~2-3s
  - Claude response: ~2-3s
  - ElevenLabs TTS: ~3-5s
  - Network overhead: ~1-2s

### Resource Usage
- RAM: ~200-500MB (depending on traffic)
- CPU: Low (<10%) except during voice processing
- Database: ~1-5MB per user (conversations + memory)

---

**This structure is designed for clarity, maintainability, and easy extension. Each file has a single responsibility, making the codebase easy to understand and modify.**
