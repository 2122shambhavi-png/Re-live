# Saathi Voice Backend 🎙️

**An emotionally intelligent AI companion backend that helps lonely adults feel heard and comforted through voice conversation.**

---

## 🌟 Features

- **Role-Based Conversations**: AI adapts to be whoever the user needs (daughter, son, husband, wife, mother, father, friend, grandparents)
- **Voice Pipeline**: Complete audio → text → AI → audio flow
- **Multilingual Support**: Natural Hindi-English (Hinglish) mixing, plus other language pairs
- **Emotional Intelligence**: Detects mood and adapts tone accordingly
- **Memory System**: Remembers context across conversations for personalized interactions
- **Crisis Detection**: Identifies and responds to mental health emergencies with safety resources
- **Natural Conversations**: Feels like talking to a real person, not a chatbot

---

## 🏗️ Architecture

```
User speaks → Audio Upload → Whisper (Speech-to-Text)
                                    ↓
                              Claude AI (Response Generation)
                                    ↓
                           ElevenLabs (Text-to-Speech)
                                    ↓
                              Audio Response → User hears
```

### Tech Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **AI**: Claude Sonnet 4 (Anthropic)
- **Speech-to-Text**: OpenAI Whisper
- **Text-to-Speech**: ElevenLabs
- **File Upload**: Multer

---

## 📦 Installation

### Prerequisites

- Node.js 16+ 
- PostgreSQL 12+
- API Keys for:
  - Anthropic (Claude)
  - OpenAI (Whisper)
  - ElevenLabs (TTS)

### Steps

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd saathi-voice-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your API keys:
```env
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
ELEVENLABS_API_KEY=your_key_here
DB_HOST=localhost
DB_NAME=saathi_voice
DB_USER=postgres
DB_PASSWORD=your_password
```

4. **Set up database**
```bash
# Create database
createdb saathi_voice

# Run schema
psql -d saathi_voice -f database/schema.sql
```

5. **Start the server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:3000`

---

## 🔌 API Endpoints

### User Management

#### Create User
```http
POST /api/users
Content-Type: application/json

{
  "userId": "user123",
  "name": "Rajesh Kumar",
  "phone": "+919876543210",
  "email": "rajesh@example.com"
}
```

#### Select Conversation Role
```http
POST /api/users/select-role
Content-Type: application/json

{
  "userId": "user123",
  "role": "daughter",
  "languageMix": "hi-en"
}
```

**Available Roles**: `daughter`, `son`, `husband`, `wife`, `mother`, `father`, `friend`, `grandfather`, `grandmother`

#### Get Available Roles
```http
GET /api/roles
```

### Conversation

#### Voice Input (Complete Pipeline)
```http
POST /api/conversation/voice
Content-Type: multipart/form-data

userId: user123
audio: [audio file - .webm, .mp3, .wav]
```

**Response**: Audio file (MP3) with headers:
- `X-Transcribed-Text`: User's transcribed message (base64)
- `X-AI-Response-Text`: AI's text response (base64)
- `X-Mood-Detected`: Detected mood (`sad`, `happy`, `anxious`, etc.)
- `X-Crisis-Level`: Crisis severity if detected (`low`, `medium`, `high`)

#### Text Input (Alternative)
```http
POST /api/conversation/text
Content-Type: application/json

{
  "userId": "user123",
  "message": "Aaj mujhe bahut bura lag raha hai"
}
```

**Response**:
```json
{
  "response": "Mummy main samajh sakti hoon...",
  "mood": "sad",
  "crisisLevel": "none"
}
```

#### Get Conversation History
```http
GET /api/conversation/history/user123?limit=10
```

#### Get Memory Summary
```http
GET /api/conversation/memory/user123
```

---

## 🎭 How Role Personalities Work

Each role has a distinct personality configured in `config/personalities.js`:

### Example: Daughter Role

```javascript
{
  systemPrompt: "You are the user's loving daughter...",
  voiceId: "ELEVENLABS_VOICE_ID",
  emotionalTone: "caring-daughter"
}
```

**Characteristics**:
- Uses "Mummy", "Papa" naturally
- Warm, validating, never dismissive
- Short responses (1-3 sentences for voice)
- Adapts to parent's emotional state

**Example Conversation**:
```
User: "Beta bahut busy rehta hai, mujhe yaad nahi karta"
AI (as daughter): "Papa aisa bilkul nahi hai. Main bahut busy hoon par aapki parvaah hamesha hai. I miss you too."
```

---

## 💾 Database Schema

### Tables

**users**
- User profiles and current role selection
- Language preferences

**conversations**
- Full conversation history
- Mood and topic detection
- Timestamps

**memory_context**
- Long-term memory for each user
- Key details (family, interests)
- Last topics and mood

**crisis_alerts**
- Logs high-risk conversations
- Severity tracking
- Response auditing

---

## 🚨 Crisis Detection

The system monitors for keywords indicating mental health emergencies:

**High Severity**: "suicide", "मरना चाहता", "kill myself"
- Response includes crisis helpline numbers
- Conversation logged for review

**Medium Severity**: "depressed", "hopeless", "can't go on"
- Gentle suggestion to seek support

**Low Severity**: "very sad", "struggling"
- Extra empathy, no specific intervention

### India Crisis Resources
- **AASRA**: 9820466726
- **Vandrevala Foundation**: 9999666555

---

## 🎤 Voice Configuration

### ElevenLabs Setup

1. Create voices for each role in ElevenLabs dashboard
2. Copy Voice IDs to `.env`:

```env
VOICE_ID_DAUGHTER=21m00Tcm4TlvDq8ikWAM
VOICE_ID_SON=AZnzlk1XvdvUeBnXmlld
# ... etc
```

3. Use `eleven_multilingual_v2` model for Hindi-English support

### Voice Settings (in code)
```javascript
{
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.5,
  use_speaker_boost: true
}
```

---

## 🧠 Memory System

### How It Works

1. **After each conversation**, system extracts:
   - Mood (sad, happy, anxious, etc.)
   - Topics (family, health, work, etc.)
   - Key details mentioned

2. **Memory context is injected** into next conversation:
```
Previous context: User misses daughter in Mumbai. Recently had fight with husband.
Last mood: sad
```

3. **AI uses this to personalize** responses without being told explicitly.

### Example
```
Conversation 1:
User: "Meri beti Mumbai mein rehti hai"
AI: "Mumbai bahut door hai na. Aap unhe miss karti hain?"

[Memory saved: daughter lives in Mumbai]

Conversation 2 (next day):
User: "Aaj akela feel ho raha hai"
AI: "Main samajh sakti hoon. Mumbai mein beti se baat ki aaj?"
      ↑ AI remembers daughter is in Mumbai
```

---

## 🧪 Testing

### Test with cURL

**1. Create User**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-1",
    "name": "Test User",
    "phone": "+919999999999"
  }'
```

**2. Select Role**
```bash
curl -X POST http://localhost:3000/api/users/select-role \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-1",
    "role": "daughter",
    "languageMix": "hi-en"
  }'
```

**3. Send Text Message**
```bash
curl -X POST http://localhost:3000/api/conversation/text \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-1",
    "message": "Aaj mujhe bahut akela feel ho raha hai"
  }'
```

**4. Send Voice Message**
```bash
curl -X POST http://localhost:3000/api/conversation/voice \
  -F "userId=test-user-1" \
  -F "audio=@test-audio.webm" \
  --output response.mp3
```

---

## 🔐 Security Considerations

### Current Implementation
- CORS configured for allowed origins
- File upload size limits (10MB)
- Audio file type validation
- Database parameterized queries (SQL injection protection)

### Production Recommendations
- **Add authentication**: JWT tokens for user sessions
- **Rate limiting**: Prevent abuse (e.g., express-rate-limit)
- **HTTPS only**: SSL/TLS certificates
- **API key rotation**: Regular key updates
- **Input sanitization**: Extra validation layers
- **Audit logging**: Track all crisis alerts
- **Data encryption**: Encrypt sensitive user data at rest

---

## 📊 Monitoring

### Key Metrics to Track

1. **Conversation Metrics**
   - Average response time
   - Conversations per user per day
   - Role distribution

2. **Crisis Alerts**
   - Daily count by severity
   - Response accuracy
   - Follow-up rate

3. **Technical Health**
   - API latency (Whisper, Claude, ElevenLabs)
   - Database query performance
   - Error rates

### Sample Monitoring Query
```sql
-- Daily crisis alerts
SELECT 
  DATE(created_at) as date,
  severity,
  COUNT(*) as count
FROM crisis_alerts
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY date, severity
ORDER BY date DESC;
```

---

## 🚀 Deployment

### Option 1: Railway

1. Push to GitHub
2. Connect Railway to your repo
3. Add environment variables in Railway dashboard
4. Deploy!

### Option 2: AWS EC2

1. Set up EC2 instance (Ubuntu)
2. Install Node.js and PostgreSQL
3. Clone repo and install dependencies
4. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start server.js --name saathi-voice
pm2 startup
pm2 save
```

### Option 3: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🐛 Troubleshooting

### Common Issues

**1. Database connection fails**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
- Check PostgreSQL is running: `pg_isready`
- Verify credentials in `.env`
- Check if database exists: `psql -l`

**2. Whisper API fails**
```
Error: Failed to transcribe audio
```
- Check OpenAI API key is valid
- Verify audio file format (webm, mp3, wav)
- Check file size < 25MB

**3. ElevenLabs voice not found**
```
Error: No voice ID configured for role: daughter
```
- Add Voice IDs to `.env`
- Verify voice IDs in ElevenLabs dashboard

**4. Memory: JavaScript heap out of memory**
```
FATAL ERROR: Reached heap limit
```
- Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=4096 npm start`

---

## 🛣️ Roadmap

### V1.0 (Current)
- ✅ Role-based conversations
- ✅ Voice pipeline (audio in/out)
- ✅ Memory system
- ✅ Crisis detection
- ✅ 9 personality roles

### V1.1 (Next)
- [ ] User authentication (JWT)
- [ ] Real-time websocket for live conversation
- [ ] Mobile app integration
- [ ] Advanced memory with semantic search
- [ ] Multi-language support (Spanish, French, etc.)

### V2.0 (Future)
- [ ] Video call support (avatar)
- [ ] Group conversations (family therapy mode)
- [ ] Scheduled check-ins
- [ ] Integration with mental health professionals
- [ ] Analytics dashboard for caregivers

---

## 🤝 Contributing

We welcome contributions! Areas we need help:

1. **Better crisis detection** - Improve keyword matching, add context awareness
2. **More languages** - Add support for regional languages
3. **Voice quality** - Fine-tune ElevenLabs settings per role
4. **Testing** - Unit tests, integration tests
5. **Documentation** - More examples, tutorials

---

## 📄 License

MIT License - Feel free to use this for good causes!

---

## ⚠️ Ethical Considerations

### Important Notes

1. **Not a replacement for therapy**: Saathi Voice is a companion, not a therapist
2. **Crisis situations**: Always encourage professional help for serious mental health issues
3. **Privacy**: User conversations are sensitive - handle with care
4. **Dependency**: Design to encourage real-world connections, not replace them
5. **Cultural sensitivity**: Adapt personalities to cultural contexts

### Safety Guidelines

- Never claim medical/psychiatric expertise
- Always include crisis helpline info for high-risk conversations
- Regular audits of crisis alerts
- Clear user disclaimers about AI nature
- Data retention policies (consider auto-deletion after X days)

---

## 📞 Support

For questions or issues:
- Open a GitHub issue
- Email: support@saathivoice.com (example)

---

**Built with ❤️ to help lonely people feel less alone.**
