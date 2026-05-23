const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { rolePersonalities } = require('../config/personalities');

class SpeechService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
  }

  /**
   * Convert audio to text using OpenAI Whisper
   */
  async transcribeAudio(audioBuffer, audioFilename = 'audio.webm') {
    try {
      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename: audioFilename,
        contentType: 'audio/webm'
      });
      formData.append('model', 'whisper-1');
      formData.append('language', 'hi'); // Hint that it might be Hindi/Hinglish

      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            ...formData.getHeaders()
          }
        }
      );

      return response.data.text;
    } catch (error) {
      console.error('Transcription Error:', error.response?.data || error.message);
      throw new Error('Failed to transcribe audio');
    }
  }

  /**
   * Convert text to speech using ElevenLabs
   */
  async synthesizeSpeech(text, role = 'daughter') {
    try {
      // Get voice ID for the role
      const personality = rolePersonalities[role];
      const voiceId = personality?.voiceId || process.env.VOICE_ID_DAUGHTER;

      if (!voiceId) {
        throw new Error(`No voice ID configured for role: ${role}`);
      }

      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text: text,
          model_id: 'eleven_multilingual_v2', // Supports Hindi-English
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true
          }
        },
        {
          headers: {
            'xi-api-key': this.elevenLabsApiKey,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );

      return Buffer.from(response.data);
    } catch (error) {
      console.error('TTS Error:', error.response?.data || error.message);
      throw new Error('Failed to synthesize speech');
    }
  }

  /**
   * Save audio buffer to file (for testing or caching)
   */
  async saveAudioFile(audioBuffer, filename) {
    const filepath = path.join(__dirname, '../temp', filename);
    
    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    fs.writeFileSync(filepath, audioBuffer);
    return filepath;
  }
}

module.exports = new SpeechService();
