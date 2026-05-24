const express = require('express');
const router = express.Router();
const claude = require('../services/claudeService');

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'WildLens API' });
});

router.post('/identify', async (req, res) => {
  const { image, mimeType, mode, lang, voiceStyle } = req.body;
  if (!image) return res.status(400).json({ error: 'image (base64) is required' });
  try {
    const data = await claude.identifyAnimal(image, mimeType || 'image/jpeg', mode, lang, voiceStyle);
    res.json(data);
  } catch (e) {
    console.error('[/identify]', e.message);
    res.status(500).json({ error: e.message || 'Identification failed' });
  }
});

router.post('/identify-by-name', async (req, res) => {
  const { name, mode, lang, voiceStyle } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    const data = await claude.identifyByName(name, mode, lang, voiceStyle);
    res.json(data);
  } catch (e) {
    console.error('[/identify-by-name]', e.message);
    res.status(500).json({ error: e.message || 'Identification failed' });
  }
});

router.post('/chat', async (req, res) => {
  const { animal, history, message, mode, lang } = req.body;
  if (!animal || !message) return res.status(400).json({ error: 'animal and message are required' });
  try {
    const reply = await claude.chat(animal, history || [], message, mode, lang);
    res.json({ reply });
  } catch (e) {
    console.error('[/chat]', e.message);
    res.status(500).json({ error: e.message || 'Chat failed' });
  }
});

module.exports = router;
