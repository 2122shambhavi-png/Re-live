# Quick Start Guide ⚡

Get Saathi Voice backend running in 5 minutes!

---

## Prerequisites Check

Before you start, make sure you have:

- [ ] Node.js 16+ installed (`node --version`)
- [ ] PostgreSQL 12+ installed (`psql --version`)
- [ ] API keys ready:
  - Anthropic API key (get at console.anthropic.com)
  - OpenAI API key (get at platform.openai.com)
  - ElevenLabs API key (get at elevenlabs.io)

---

## Step 1: Installation (2 minutes)

```bash
# Clone the repository
cd saathi-voice-backend

# Install dependencies
npm install
```

---

## Step 2: Database Setup (1 minute)

```bash
# Create database
createdb saathi_voice

# Or using psql:
psql -U postgres
CREATE DATABASE saathi_voice;
\q

# Run schema
psql -d saathi_voice -f database/schema.sql
```

**Expected output:**
```
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE INDEX
...
INSERT 0 2
INSERT 0 2
```

---

## Step 3: Environment Variables (1 minute)

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your favorite editor
nano .env
# or
code .env
```

**Minimum required configuration:**

```env
# Database (use your local PostgreSQL credentials)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saathi_voice
DB_USER=postgres
DB_PASSWORD=your_password

# API Keys (REQUIRED for voice/AI features to work)
ANTHROPIC_API_KEY=sk-ant-your-key-here
OPENAI_API_KEY=sk-your-key-here
ELEVENLABS_API_KEY=your-key-here

# Voice IDs (get these from ElevenLabs dashboard)
VOICE_ID_DAUGHTER=your_voice_id
VOICE_ID_SON=your_voice_id
# ... add more as needed

# Server
PORT=3000
NODE_ENV=development
```

**Quick ElevenLabs Voice Setup:**
1. Go to elevenlabs.io
2. Create account
3. Go to "Voice Library"
4. Pick 9 voices (for each role)
5. Copy Voice IDs to `.env`

---

## Step 4: Start Server (30 seconds)

```bash
npm start
```

**Expected output:**
```
✅ Database connected successfully

🎙️  Saathi Voice Backend Started
================================
🚀 Server running on port 3000
📍 Base URL: http://localhost:3000
🏥 Health check: http://localhost:3000/api/health

Available endpoints:
  POST /api/users - Create user
  POST /api/users/select-role - Select conversation role
  ...
```

✅ **Server is running!**

---

## Step 5: Test It! (30 seconds)

Open another terminal and run:

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Should return:
# {"status":"healthy","timestamp":"2025-05-23T...","service":"Saathi Voice API"}
```

**Run full test suite:**
```bash
node test-api.js
```

**Expected output:**
```
🧪 Saathi Voice API Test Suite
================================

1️⃣  Testing Health Check...
✓ Health check passed

2️⃣  Testing Get Available Roles...
✓ Found 9 roles
...

================================
📊 Test Summary
================================
Total tests: 8
Passed: 8
Failed: 0
🎉 All tests passed!
```

---

## Quick Test: Send Your First Message

```bash
# 1. Create a test user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "my-test-user",
    "name": "My Name"
  }'

# 2. Select a role (daughter)
curl -X POST http://localhost:3000/api/users/select-role \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "my-test-user",
    "role": "daughter",
    "languageMix": "hi-en"
  }'

# 3. Send a text message
curl -X POST http://localhost:3000/api/conversation/text \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "my-test-user",
    "message": "Aaj mujhe bahut akela feel ho raha hai"
  }'

# You should get a warm, caring response from the AI!
```

---

## Next Steps

### Option A: Build a Frontend

See `FRONTEND_INTEGRATION.md` for:
- React web app example
- React Native mobile app example
- Complete code samples

### Option B: Test Voice Features

You'll need:
1. Record an audio file (use your phone or computer mic)
2. Save as `test.webm` or `test.mp3`
3. Send it:

```bash
curl -X POST http://localhost:3000/api/conversation/voice \
  -F "userId=my-test-user" \
  -F "audio=@test.webm" \
  --output response.mp3

# Play the response
# macOS: afplay response.mp3
# Linux: mpg123 response.mp3
# Windows: start response.mp3
```

### Option C: Deploy to Production

See `DEPLOYMENT.md` for deployment guides:
- Railway (easiest)
- Render (free tier available)
- AWS EC2 (full control)
- DigitalOcean

---

## Common Issues & Fixes

### Issue 1: Database connection fails

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Fix:**
```bash
# Check if PostgreSQL is running
pg_isready

# If not running, start it:
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
# Windows: net start postgresql-x64-14
```

---

### Issue 2: "Module not found"

**Error:** `Error: Cannot find module 'express'`

**Fix:**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

---

### Issue 3: API key errors

**Error:** `401 Unauthorized` or `Invalid API key`

**Fix:**
1. Check `.env` file exists
2. Verify API keys are correct (no extra spaces)
3. Restart server after changing `.env`

---

### Issue 4: Voice features don't work

**Error:** `Failed to transcribe audio` or `Failed to synthesize speech`

**Possible causes:**
1. Missing OpenAI or ElevenLabs API key
2. Invalid voice ID
3. Audio file format not supported

**Fix:**
```bash
# Test OpenAI API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Test ElevenLabs API key
curl https://api.elevenlabs.io/v1/voices \
  -H "xi-api-key: $ELEVENLABS_API_KEY"
```

---

## Development Tips

### Auto-restart on file changes

```bash
# Install nodemon globally
npm install -g nodemon

# Run in dev mode
npm run dev
```

### View logs in real-time

```bash
# In one terminal, start server
npm start

# In another terminal, tail logs
tail -f logs/app.log  # if you set up logging
```

### Database GUI tools

Recommended:
- **pgAdmin** (free, cross-platform)
- **TablePlus** (beautiful UI, $59)
- **Postico** (macOS, free/paid)

Connect with:
- Host: localhost
- Port: 5432
- Database: saathi_voice
- User: postgres

---

## Architecture Overview

```
┌─────────────┐
│   Frontend  │ (React/React Native/Flutter)
│   (Your app)│
└──────┬──────┘
       │ HTTP/REST
       ▼
┌─────────────────────┐
│   Express Server    │ (This backend)
│   Port 3000         │
└──────┬──────────────┘
       │
       ├─────────► PostgreSQL (User data, conversations)
       │
       ├─────────► Claude API (AI responses)
       │
       ├─────────► Whisper API (Speech-to-text)
       │
       └─────────► ElevenLabs (Text-to-speech)
```

---

## API Cheat Sheet

### Essential Endpoints

```bash
# Health Check
GET /api/health

# Get Available Roles
GET /api/roles

# Create User
POST /api/users
Body: { userId, name, phone, email }

# Select Role
POST /api/users/select-role
Body: { userId, role, languageMix }

# Text Chat
POST /api/conversation/text
Body: { userId, message }

# Voice Chat
POST /api/conversation/voice
Form: userId, audio (file)

# Get History
GET /api/conversation/history/:userId?limit=10

# Get Memory
GET /api/conversation/memory/:userId
```

---

## What to Build Next?

Ideas for your Saathi Voice app:

1. **Mobile App** - iOS/Android with voice recording
2. **WhatsApp Bot** - Integrate via Twilio
3. **Web App** - Browser-based chat with voice
4. **Smart Speaker** - Alexa/Google Home skill
5. **Scheduled Check-ins** - Daily "how are you?" messages
6. **Family Dashboard** - Let family see (anonymized) mood trends
7. **Group Therapy Mode** - Multiple roles in one conversation
8. **Video Avatar** - Add video call with animated character

---

## Need Help?

- 📖 Full docs: See `README.md`
- 🚀 Deployment: See `DEPLOYMENT.md`
- 💻 Frontend: See `FRONTEND_INTEGRATION.md`
- 📁 Structure: See `PROJECT_STRUCTURE.md`

**Found a bug?** Open an issue on GitHub
**Have questions?** Start a discussion

---

**You're all set! Start building something amazing! 🎉**
