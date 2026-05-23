const db = require('../config/database');

class MemoryService {
  /**
   * Get memory context for a user
   */
  async getMemoryContext(userId) {
    try {
      const result = await db.query(
        'SELECT summary, key_details, last_topics, last_mood FROM memory_context WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const memory = result.rows[0];
      
      // Format memory context for AI prompt
      return this.formatMemoryForPrompt(memory);
    } catch (error) {
      console.error('Memory retrieval error:', error);
      return null;
    }
  }

  /**
   * Format memory object into natural language for AI prompt
   */
  formatMemoryForPrompt(memory) {
    if (!memory) return 'No previous context available.';

    let context = '';

    if (memory.summary) {
      context += `Previous context: ${memory.summary}\n`;
    }

    if (memory.key_details) {
      const details = memory.key_details;
      if (details.family) {
        context += `Family: ${JSON.stringify(details.family)}\n`;
      }
      if (details.interests) {
        context += `Interests: ${details.interests.join(', ')}\n`;
      }
    }

    if (memory.last_topics && memory.last_topics.length > 0) {
      context += `Recent topics: ${memory.last_topics.join(', ')}\n`;
    }

    if (memory.last_mood) {
      context += `Last mood: ${memory.last_mood}`;
    }

    return context || 'No previous context available.';
  }

  /**
   * Update memory context after conversation
   */
  async updateMemoryContext(userId, conversationData) {
    try {
      const { mood, topics, userMessage, aiResponse } = conversationData;

      // Get existing memory
      const existing = await db.query(
        'SELECT summary, key_details, last_topics FROM memory_context WHERE user_id = $1',
        [userId]
      );

      let summary = '';
      let keyDetails = {};
      let lastTopics = topics || [];

      if (existing.rows.length > 0) {
        summary = existing.rows[0].summary || '';
        keyDetails = existing.rows[0].key_details || {};
        lastTopics = [...new Set([...topics, ...(existing.rows[0].last_topics || [])])].slice(0, 5);
      }

      // Generate new summary (simple approach - could use AI for better summarization)
      summary = this.updateSummary(summary, userMessage, mood);

      // Upsert memory
      await db.query(
        `INSERT INTO memory_context (user_id, summary, key_details, last_topics, last_mood, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (user_id) 
         DO UPDATE SET 
           summary = $2,
           key_details = $3,
           last_topics = $4,
           last_mood = $5,
           updated_at = NOW()`,
        [userId, summary, JSON.stringify(keyDetails), lastTopics, mood]
      );

      console.log(`Memory updated for user: ${userId}`);
    } catch (error) {
      console.error('Memory update error:', error);
    }
  }

  /**
   * Simple summary update logic
   */
  updateSummary(existingSummary, newMessage, mood) {
    // This is a simple approach - in production, you might use AI to generate better summaries
    const moodDescriptions = {
      sad: 'feeling sad',
      lonely: 'feeling lonely',
      happy: 'feeling happy',
      anxious: 'feeling anxious',
      angry: 'feeling upset'
    };

    const moodDesc = moodDescriptions[mood] || '';
    
    // Keep summary concise (max 200 chars)
    let newSummary = existingSummary;
    
    if (moodDesc) {
      // Add to summary if not already there
      if (!newSummary.includes(moodDesc)) {
        newSummary = `User recently ${moodDesc}. ${newSummary}`.slice(0, 200);
      }
    }

    return newSummary;
  }

  /**
   * Get recent conversation history
   */
  async getRecentConversations(userId, limit = 5) {
    try {
      const result = await db.query(
        `SELECT conversation_id, role, messages, mood_detected, topics, created_at 
         FROM conversations 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows;
    } catch (error) {
      console.error('Recent conversations error:', error);
      return [];
    }
  }

  /**
   * Save conversation to database
   */
  async saveConversation(userId, conversationData) {
    try {
      const { role, messages, mood, topics, durationSeconds } = conversationData;

      const result = await db.query(
        `INSERT INTO conversations (user_id, role, messages, mood_detected, topics, duration_seconds, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING conversation_id`,
        [userId, role, JSON.stringify(messages), mood, topics || [], durationSeconds || 0]
      );

      const conversationId = result.rows[0].conversation_id;
      
      // Update memory context after saving conversation
      await this.updateMemoryContext(userId, conversationData);

      return conversationId;
    } catch (error) {
      console.error('Save conversation error:', error);
      throw error;
    }
  }

  /**
   * Log crisis alert
   */
  async logCrisisAlert(userId, messageText, severity, aiResponse) {
    try {
      await db.query(
        `INSERT INTO crisis_alerts (user_id, message_text, severity, ai_response, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [userId, messageText, severity, aiResponse]
      );

      console.log(`⚠️ Crisis alert logged for user ${userId} - Severity: ${severity}`);
    } catch (error) {
      console.error('Crisis alert logging error:', error);
    }
  }
}

module.exports = new MemoryService();
