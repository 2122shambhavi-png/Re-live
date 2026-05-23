const axios = require('axios');
require('dotenv').config();

const { rolePersonalities, detectCrisisLevel, crisisResponse } = require('../config/personalities');

class AIService {
  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    this.baseURL = 'https://api.anthropic.com/v1/messages';
    this.model = 'claude-sonnet-4-20250514';
  }

  /**
   * Generate AI response based on user input and context
   */
  async generateResponse({ userMessage, role, memoryContext, languageMix = 'hi-en' }) {
    try {
      // Check for crisis keywords first
      const crisisLevel = detectCrisisLevel(userMessage);
      
      // Get role personality
      const personality = rolePersonalities[role];
      if (!personality) {
        throw new Error(`Invalid role: ${role}`);
      }

      // Build system prompt with memory context
      const systemPrompt = this.buildSystemPrompt(personality, memoryContext, languageMix);

      // Prepare messages for Claude
      const messages = [
        {
          role: 'user',
          content: userMessage
        }
      ];

      // Call Claude API
      const response = await axios.post(
        this.baseURL,
        {
          model: this.model,
          max_tokens: 200, // Keep responses short for voice
          system: systemPrompt,
          messages: messages
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          }
        }
      );

      let aiResponse = response.data.content[0].text;

      // If crisis detected, append safety message
      if (crisisLevel === 'high' || crisisLevel === 'medium') {
        const safetyMessage = crisisResponse[crisisLevel];
        if (safetyMessage) {
          aiResponse = `${aiResponse}\n\n${safetyMessage}`;
        }
      }

      return {
        text: aiResponse,
        crisisLevel: crisisLevel,
        mood: this.detectMood(userMessage)
      };
    } catch (error) {
      console.error('AI Service Error:', error.response?.data || error.message);
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Build system prompt with role personality and memory
   */
  buildSystemPrompt(personality, memoryContext, languageMix) {
    const languageInstruction = this.getLanguageInstruction(languageMix);
    
    let prompt = `${personality.systemPrompt}

${languageInstruction}

CRITICAL RULES:
- Respond in 1-3 sentences maximum (this is for voice conversation)
- Be emotionally present, not solution-focused
- Match the user's emotional tone
- Use natural ${languageMix} mix
- Stay in character as ${personality.emotionalTone}
- Never break character or mention you're an AI

MEMORY CONTEXT (use this to personalize your response):
${memoryContext || 'No previous context available.'}

Remember: You are speaking AS this person, not ABOUT them. Be real, be present, be brief.`;

    return prompt;
  }

  /**
   * Get language-specific instruction
   */
  getLanguageInstruction(languageMix) {
    const languageMap = {
      'hi-en': 'Mix Hindi and English naturally (Hinglish). Use Hindi for emotions, English for some words. Example: "Mummy koi baat nahi, you\'re doing great."',
      'en': 'Respond in English only, but keep a warm conversational tone.',
      'hi': 'Respond in Hindi only (Devanagari script).',
      'es-en': 'Mix Spanish and English naturally (Spanglish).',
      'es': 'Respond in Spanish only.',
    };

    return languageMap[languageMix] || languageMap['hi-en'];
  }

  /**
   * Simple mood detection from user message
   */
  detectMood(message) {
    const lowerMessage = message.toLowerCase();
    
    const moodKeywords = {
      sad: ['दुखी', 'sad', 'upset', 'रो', 'cry', 'depressed', 'lonely', 'अकेला', 'बुरा'],
      happy: ['खुश', 'happy', 'good', 'great', 'अच्छा', 'बढ़िया', 'मस्त'],
      anxious: ['चिंता', 'worried', 'anxious', 'डर', 'scared', 'nervous', 'घबरा'],
      angry: ['गुस्सा', 'angry', 'mad', 'frustrated', 'नाराज़'],
      lonely: ['अकेला', 'lonely', 'alone', 'सूना', 'empty'],
    };

    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      for (const keyword of keywords) {
        if (lowerMessage.includes(keyword)) {
          return mood;
        }
      }
    }

    return 'neutral';
  }
}

module.exports = new AIService();
