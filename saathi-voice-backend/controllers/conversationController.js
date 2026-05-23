const db = require('../config/database');
const aiService = require('../services/aiService');
const speechService = require('../services/speechService');
const memoryService = require('../services/memoryService');

class ConversationController {
  /**
   * Handle voice input - full pipeline
   * Audio → Text → AI Response → Audio
   */
  async handleVoiceInput(req, res) {
    try {
      const { userId } = req.body;
      const audioFile = req.file;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      if (!audioFile) {
        return res.status(400).json({ error: 'Audio file is required' });
      }

      const startTime = Date.now();

      // Step 1: Get user's current role and language
      const userResult = await db.query(
        'SELECT current_role, language_mix FROM users WHERE user_id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { current_role: role, language_mix: languageMix } = userResult.rows[0];

      // Step 2: Transcribe audio to text
      console.log('🎤 Transcribing audio...');
      const userMessage = await speechService.transcribeAudio(
        audioFile.buffer,
        audioFile.originalname
      );
      console.log(`📝 Transcribed: "${userMessage}"`);

      // Step 3: Get memory context
      const memoryContext = await memoryService.getMemoryContext(userId);

      // Step 4: Generate AI response
      console.log('🤖 Generating AI response...');
      const aiResult = await aiService.generateResponse({
        userMessage,
        role,
        memoryContext,
        languageMix
      });
      console.log(`💬 AI Response: "${aiResult.text}"`);

      // Step 5: Convert AI response to speech
      console.log('🔊 Synthesizing speech...');
      const audioBuffer = await speechService.synthesizeSpeech(aiResult.text, role);

      // Step 6: Save conversation
      const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
      const messages = [
        { speaker: 'user', text: userMessage, timestamp: new Date().toISOString() },
        { speaker: 'ai', text: aiResult.text, timestamp: new Date().toISOString() }
      ];

      await memoryService.saveConversation(userId, {
        role,
        messages,
        mood: aiResult.mood,
        topics: this.extractTopics(userMessage),
        durationSeconds,
        userMessage,
        aiResponse: aiResult.text
      });

      // Step 7: Log crisis alert if detected
      if (aiResult.crisisLevel) {
        await memoryService.logCrisisAlert(
          userId,
          userMessage,
          aiResult.crisisLevel,
          aiResult.text
        );
      }

      // Return audio response
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length,
        'X-Transcribed-Text': Buffer.from(userMessage).toString('base64'),
        'X-AI-Response-Text': Buffer.from(aiResult.text).toString('base64'),
        'X-Mood-Detected': aiResult.mood,
        'X-Crisis-Level': aiResult.crisisLevel || 'none'
      });

      res.send(audioBuffer);
    } catch (error) {
      console.error('Voice input error:', error);
      res.status(500).json({ 
        error: 'Failed to process voice input',
        details: error.message 
      });
    }
  }

  /**
   * Handle text input (alternative to voice)
   */
  async handleTextInput(req, res) {
    try {
      const { userId, message } = req.body;

      if (!userId || !message) {
        return res.status(400).json({ error: 'userId and message are required' });
      }

      // Get user's current role
      const userResult = await db.query(
        'SELECT current_role, language_mix FROM users WHERE user_id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { current_role: role, language_mix: languageMix } = userResult.rows[0];

      // Get memory context
      const memoryContext = await memoryService.getMemoryContext(userId);

      // Generate AI response
      const aiResult = await aiService.generateResponse({
        userMessage: message,
        role,
        memoryContext,
        languageMix
      });

      // Save conversation
      const messages = [
        { speaker: 'user', text: message, timestamp: new Date().toISOString() },
        { speaker: 'ai', text: aiResult.text, timestamp: new Date().toISOString() }
      ];

      await memoryService.saveConversation(userId, {
        role,
        messages,
        mood: aiResult.mood,
        topics: this.extractTopics(message),
        userMessage: message,
        aiResponse: aiResult.text
      });

      // Log crisis if detected
      if (aiResult.crisisLevel) {
        await memoryService.logCrisisAlert(
          userId,
          message,
          aiResult.crisisLevel,
          aiResult.text
        );
      }

      res.json({
        response: aiResult.text,
        mood: aiResult.mood,
        crisisLevel: aiResult.crisisLevel || 'none'
      });
    } catch (error) {
      console.error('Text input error:', error);
      res.status(500).json({ 
        error: 'Failed to process text input',
        details: error.message 
      });
    }
  }

  /**
   * Get conversation history
   */
  async getHistory(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 10 } = req.query;

      const conversations = await memoryService.getRecentConversations(
        userId, 
        parseInt(limit)
      );

      res.json({ conversations });
    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({ error: 'Failed to get conversation history' });
    }
  }

  /**
   * Get memory summary for user
   */
  async getMemorySummary(req, res) {
    try {
      const { userId } = req.params;

      const result = await db.query(
        'SELECT * FROM memory_context WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.json({ 
          message: 'No memory context available yet',
          memory: null 
        });
      }

      res.json({ memory: result.rows[0] });
    } catch (error) {
      console.error('Get memory error:', error);
      res.status(500).json({ error: 'Failed to get memory summary' });
    }
  }

  /**
   * Extract topics from message (simple keyword extraction)
   */
  extractTopics(message) {
    const topicKeywords = {
      family: ['family', 'परिवार', 'daughter', 'बेटी', 'son', 'बेटा', 'husband', 'wife', 'पत्नी', 'पति'],
      health: ['health', 'स्वास्थ्य', 'sick', 'बीमार', 'doctor', 'डॉक्टर'],
      loneliness: ['lonely', 'अकेला', 'alone', 'सूना'],
      work: ['work', 'काम', 'job', 'नौकरी', 'office'],
      money: ['money', 'पैसा', 'financial', 'आर्थिक'],
    };

    const topics = [];
    const lowerMessage = message.toLowerCase();

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      for (const keyword of keywords) {
        if (lowerMessage.includes(keyword.toLowerCase())) {
          topics.push(topic);
          break;
        }
      }
    }

    return topics.length > 0 ? topics : ['general'];
  }
}

module.exports = new ConversationController();
