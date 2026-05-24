const Anthropic = require('@anthropic-ai/sdk');

// SDK auto-reads ANTHROPIC_API_KEY from environment (set via .env locally or platform dashboard in prod)
const client = new Anthropic();

const MODE_PROMPTS = {
  kid:     'Use very simple words and short sentences. Add fun emojis throughout. Make comparisons to everyday things kids know. Be super enthusiastic and encouraging! Start with something exciting like "WOW! This is a..."',
  student: 'Use clear, educational language appropriate for ages 11–16. Include interesting scientific facts. Be engaging and informative. Reference scientific names where helpful.',
  adult:   'Be scientifically accurate and detailed. Use proper biological terminology. Include ecological relationships, conservation status context, and taxonomic information where relevant.'
};

const VOICE_PROMPTS = {
  teacher:    'Speak like a knowledgeable, encouraging teacher. Clear, educational, and informative.',
  friendly:   'Speak warmly and conversationally, like a friendly nature guide sharing something amazing.',
  cartoon:    'Speak with HUGE enthusiasm and lots of energy! Use exclamations and fun expressions. Make it super entertaining!',
  naturalist: 'Speak like David Attenborough — measured, dramatic, awe-inspiring. Paint a vivid picture of the natural world.'
};

const LANG_NAMES = {
  en: 'English', hi: 'Hindi', es: 'Spanish',
  fr: 'French',  ar: 'Arabic', zh: 'Chinese'
};

const JSON_FIELDS = 'emoji, common_name, scientific_name, habitat, diet, behavior, fun_fact, safety_note (null if not dangerous), conservation_status, introduction';

function buildSystem(mode, lang, voiceStyle) {
  return `You are a world-class wildlife expert and educator. Always respond with ONLY valid JSON — no markdown fences, no extra text.

Content level: ${MODE_PROMPTS[mode] || MODE_PROMPTS.student}
Voice style for the introduction field: ${VOICE_PROMPTS[voiceStyle] || VOICE_PROMPTS.friendly}
Language: Respond entirely in ${LANG_NAMES[lang] || 'English'}.`;
}

function parseJson(text) {
  let s = text.trim().replace(/^```(?:json)?/m, '').replace(/```$/m, '').trim();
  try { return JSON.parse(s); }
  catch {
    const m = s.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error('Could not parse AI response as JSON');
  }
}

async function identifyAnimal(imageB64, mimeType, mode, lang, voiceStyle) {
  const msg = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2048,
    system: buildSystem(mode, lang, voiceStyle),
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageB64 } },
        { type: 'text', text: `Identify the animal in this image. Return ONLY a JSON object with these fields: ${JSON_FIELDS}. No markdown — just the raw JSON object.` }
      ]
    }]
  });
  return parseJson(msg.content[0].text);
}

async function identifyByName(name, mode, lang, voiceStyle) {
  const msg = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2048,
    system: buildSystem(mode, lang, voiceStyle),
    messages: [{
      role: 'user',
      content: `Provide detailed information about the ${name}. Return ONLY a JSON object with these fields: ${JSON_FIELDS}. No markdown — just the raw JSON object.`
    }]
  });
  return parseJson(msg.content[0].text);
}

async function chat(animal, history, message, mode, lang) {
  const system = `You are a wildlife expert AI named WildLens, specialized in ${animal.common_name} (${animal.scientific_name}).

Animal context:
- Habitat: ${animal.habitat}
- Diet: ${animal.diet}
- Behavior: ${animal.behavior}
- Conservation status: ${animal.conservation_status}

${MODE_PROMPTS[mode] || MODE_PROMPTS.student}
Respond in ${LANG_NAMES[lang] || 'English'}. Keep answers concise and engaging. Never break character.`;

  const messages = [
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: message }
  ];

  const msg = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    system,
    messages
  });
  return msg.content[0].text;
}

module.exports = { identifyAnimal, identifyByName, chat };
