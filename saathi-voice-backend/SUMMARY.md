# Saathi Voice Backend - Complete Package 🎁

**Congratulations! Your complete backend is ready.** 

This package includes everything you need to run an emotionally intelligent AI companion service.

---

## 📦 What's Inside

### Core Application (13 files)
✅ **server.js** - Express server entry point  
✅ **config/** - Database connection & role personalities  
✅ **controllers/** - User & conversation request handlers  
✅ **services/** - AI, speech, and memory services  
✅ **routes/** - API endpoint definitions  
✅ **database/** - PostgreSQL schema  

### Documentation (6 files)
📖 **README.md** - Main documentation (features, API, examples)  
📖 **QUICKSTART.md** - Get running in 5 minutes  
📖 **DEPLOYMENT.md** - Production deployment guides  
📖 **FRONTEND_INTEGRATION.md** - React/React Native examples  
📖 **PROJECT_STRUCTURE.md** - Codebase architecture  

### Configuration
⚙️ **.env.example** - Environment variables template  
⚙️ **package.json** - Node.js dependencies  
⚙️ **.gitignore** - Git ignore rules  

### Testing
🧪 **test-api.js** - Complete API test suite  

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up database
createdb saathi_voice
psql -d saathi_voice -f database/schema.sql

# 3. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 4. Start server
npm start

# 5. Test it
node test-api.js
```

**See QUICKSTART.md for detailed instructions.**

---

## 🎯 What This Backend Does

### Role-Based AI Companion
- User selects who they want to talk to (daughter, son, husband, wife, mother, father, friend, grandparents)
- AI adapts personality, tone, and language to match that role
- Feels like talking to a real person who cares

### Voice Conversation Pipeline
```
User speaks → Whisper (transcribe) → Claude (generate response) → ElevenLabs (speak) → User hears
```

### Memory System
- Remembers details across conversations
- Builds context about user's life, family, interests
- Personalizes responses without being told repeatedly

### Crisis Detection
- Monitors for signs of mental health crisis
- Provides helpline resources when needed
- Logs alerts for review

### Multilingual Support
- Natural Hindi-English (Hinglish) mixing
- Supports other language pairs (Spanish-English, etc.)
- Adapts to user's communication style

---

## 🏗️ Architecture

```
┌──────────────┐
│   Frontend   │ (Your app - not included, see FRONTEND_INTEGRATION.md)
└──────┬───────┘
       │ REST API
       ▼
┌──────────────────┐
│  This Backend    │
│  Express Server  │ ◄── You are here
└──────┬───────────┘
       │
       ├─► PostgreSQL (conversations, users, memory)
       ├─► Claude API (AI responses)
       ├─► Whisper API (speech-to-text)
       └─► ElevenLabs (text-to-speech)
```

---

## 📊 Features Breakdown

### ✅ Implemented (Ready to Use)

- [x] 9 role personalities (daughter, son, husband, wife, mother, father, friend, grandparents)
- [x] Voice input/output pipeline
- [x] Text chat alternative
- [x] Conversation memory system
- [x] Crisis keyword detection
- [x] Multilingual support (Hinglish)
- [x] Mood detection
- [x] Topic extraction
- [x] User management
- [x] Conversation history
- [x] RESTful API
- [x] PostgreSQL database
- [x] Error handling
- [x] CORS support
- [x] File upload (audio)
- [x] Comprehensive documentation

### 🔮 What You Could Add

- [ ] User authentication (JWT tokens)
- [ ] Real-time WebSocket for live conversation
- [ ] Scheduled check-ins (cron jobs)
- [ ] Advanced memory (vector embeddings)
- [ ] Analytics dashboard
- [ ] Rate limiting
- [ ] Caching layer (Redis)
- [ ] More language support
- [ ] Video call avatar
- [ ] WhatsApp integration
- [ ] SMS integration (Twilio)
- [ ] Email summaries
- [ ] Family dashboard

---

## 💰 Cost Estimates

### Development/Testing (Low Usage)
- **Free Tier Options**: Render + Supabase = $0/month
- **Minimal Paid**: Railway = ~$5-10/month
- **API Usage**: ~$5-20/month (Claude, Whisper, ElevenLabs)
- **Total**: $5-30/month

### Production (Medium Traffic - 100 users)
- **Server**: Railway/Render = $20-50/month
- **Database**: Managed PostgreSQL = $15-25/month
- **API Usage**: $50-200/month (depends on conversation volume)
- **Total**: $85-275/month

### Enterprise (High Traffic - 10,000 users)
- **Servers**: AWS EC2 + Auto Scaling = $200-500/month
- **Database**: AWS RDS = $100-300/month
- **CDN + Load Balancer**: $50-100/month
- **API Usage**: $2,000-5,000/month
- **Total**: $2,350-5,900/month

**Note**: API costs dominate at scale. Consider:
- Caching common responses
- Using cheaper models for simple queries
- Self-hosted Whisper alternative

---

## 🔐 Security Considerations

### Currently Implemented
✅ CORS configuration  
✅ SQL injection protection (parameterized queries)  
✅ File type validation  
✅ File size limits  
✅ Environment variable separation  

### Recommended Additions
⚠️ User authentication (JWT)  
⚠️ Rate limiting (express-rate-limit)  
⚠️ HTTPS only in production  
⚠️ API key rotation policy  
⚠️ Input sanitization layer  
⚠️ Request logging  
⚠️ Database encryption at rest  

**See DEPLOYMENT.md → Security Hardening section**

---

## 🎓 Learning Resources

### Understanding the Code

**Start here:**
1. `server.js` - See how Express app is set up
2. `routes/api.js` - See all available endpoints
3. `controllers/conversationController.js` - See how voice pipeline works
4. `services/aiService.js` - See how Claude generates responses
5. `config/personalities.js` - See how roles are defined

**Key concepts used:**
- Express.js (web framework)
- PostgreSQL (database)
- Async/await (JavaScript)
- REST API design
- Multipart form data (file uploads)
- AI prompt engineering
- Speech processing

### Useful Documentation

- **Express.js**: https://expressjs.com/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Claude API**: https://docs.anthropic.com/
- **OpenAI Whisper**: https://platform.openai.com/docs/guides/speech-to-text
- **ElevenLabs**: https://docs.elevenlabs.io/

---

## 🐛 Troubleshooting

### Server won't start
→ Check `QUICKSTART.md` → Common Issues section

### Database errors
→ Verify PostgreSQL is running: `pg_isready`  
→ Check credentials in `.env`  
→ Ensure database exists: `psql -l | grep saathi_voice`

### API call failures
→ Check API keys are valid  
→ Verify no extra spaces in `.env`  
→ Check API service status  
→ Review error logs

### Voice features not working
→ Ensure audio file format is supported (webm, mp3, wav)  
→ Check file size < 10MB  
→ Verify ElevenLabs voice IDs are correct  
→ Test API keys separately

**Full troubleshooting guide in DEPLOYMENT.md**

---

## 🎨 Customization Guide

### Change Response Style

Edit `config/personalities.js`:
```javascript
daughter: {
  systemPrompt: `You are... [customize here]`,
  // Make daughter more playful, formal, etc.
}
```

### Add New Role

1. Add to `config/personalities.js`
2. Add voice ID to `.env`
3. Done! Auto-available via API

### Change Voice Settings

Edit `services/speechService.js` → `synthesizeSpeech()`:
```javascript
voice_settings: {
  stability: 0.5,      // 0-1 (higher = more stable)
  similarity_boost: 0.75, // 0-1 (higher = more like original)
  style: 0.5,          // 0-1 (expressiveness)
}
```

### Modify Memory Strategy

Edit `services/memoryService.js` → `updateSummary()`  
Currently uses simple text append. Could use:
- Claude API to generate better summaries
- Vector embeddings for semantic search
- Sentiment analysis

---

## 📈 Scaling Strategy

### 1-100 Users
- Single server (Railway/Render)
- Managed PostgreSQL
- No caching needed
- **Cost**: $20-50/month

### 100-1,000 Users
- Upgrade server size
- Add Redis caching
- Database read replicas
- **Cost**: $100-300/month

### 1,000-10,000 Users
- Multiple servers + load balancer
- Auto-scaling
- CDN for static assets
- Database sharding
- **Cost**: $500-2,000/month

### 10,000+ Users
- Kubernetes cluster
- Microservices architecture
- Multi-region deployment
- Advanced caching layers
- **Cost**: $2,000-10,000+/month

**See DEPLOYMENT.md for detailed scaling guides**

---

## 📝 Licensing & Ethics

### License
MIT License - Free to use, modify, and distribute

### Ethical Guidelines

**This is a companion for lonely people. With that comes responsibility:**

✅ **Do:**
- Encourage real-world connections
- Provide crisis resources when needed
- Be transparent about AI nature
- Protect user privacy
- Regular audits of crisis alerts
- Cultural sensitivity in responses

❌ **Don't:**
- Replace human relationships entirely
- Give medical/legal advice
- Claim to be a therapist
- Exploit emotional vulnerability
- Sell user data
- Create dependency

**See README.md → Ethical Considerations for full guidelines**

---

## 🙏 Acknowledgments

This backend uses:
- **Anthropic Claude** - AI responses
- **OpenAI Whisper** - Speech recognition
- **ElevenLabs** - Text-to-speech
- **PostgreSQL** - Database
- **Express.js** - Web framework

Built with care to help lonely people feel less alone.

---

## 📞 Support

**Getting Started**: See `QUICKSTART.md`  
**Full Documentation**: See `README.md`  
**Deployment Help**: See `DEPLOYMENT.md`  
**Frontend Examples**: See `FRONTEND_INTEGRATION.md`  
**Code Structure**: See `PROJECT_STRUCTURE.md`  

**Questions?** Open an issue on GitHub  
**Bug reports?** Use the issue tracker  
**Feature requests?** Start a discussion  

---

## ✨ What's Next?

1. **Read QUICKSTART.md** - Get the backend running locally
2. **Test the API** - Run `node test-api.js`
3. **Build your frontend** - See FRONTEND_INTEGRATION.md for examples
4. **Deploy** - Follow DEPLOYMENT.md when ready
5. **Share** - Help lonely people feel less alone! ❤️

---

**Thank you for building with Saathi Voice!**

Made with ❤️ to make the world a little less lonely.
