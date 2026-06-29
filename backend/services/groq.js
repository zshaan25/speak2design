/**
 * services/groq.js
 * Centralised Groq API wrapper for Speak2Design.
 * Exports three functions:
 *   - transcribeAudio()    — Groq Whisper audio-to-text
 *   - parseDesignCommand() — LLaMA NLP structured command parser
 *   - generateUI()         — LLaMA full Tailwind canvas generator
 */

import Groq from 'groq-sdk';
import { toFile } from 'groq-sdk/uploads';

/** Lazy Groq client — throws clearly if key missing */
const getGroq = () => {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set.');
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
};

// ─── MIME → file extension map ────────────────────────────────────────────────
const MIME_TO_EXT = {
  'audio/webm': 'webm',
  'audio/ogg':  'ogg',
  'audio/mp4':  'mp4',
  'audio/mpeg': 'mp3',
  'audio/wav':  'wav',
  'audio/flac': 'flac',
};

/**
 * transcribeAudio — converts an audio Buffer to text using Groq Whisper.
 *
 * @param {Buffer} audioBuffer    Raw audio bytes from multer memory storage
 * @param {string} targetLanguage 'English' | 'Urdu'
 * @param {string} mimeType       MIME type of the uploaded file
 * @returns {Promise<string>}     Transcribed text
 * @throws {Error}                On API failure or empty result
 */
export const transcribeAudio = async (audioBuffer, targetLanguage = 'English', mimeType = 'audio/webm') => {
  const groq    = getGroq();
  const safeMime = (mimeType || 'audio/webm').split(';')[0];
  const ext      = MIME_TO_EXT[safeMime] || 'webm';
  const audioFile = await toFile(audioBuffer, `audio.${ext}`, { type: safeMime });

  const result = await groq.audio.transcriptions.create({
    file:            audioFile,
    model:           'whisper-large-v3',
    response_format: 'text',
    language:        targetLanguage === 'Urdu' ? 'ur' : 'en',
  });

  const text = (typeof result === 'string' ? result : result?.text || '').trim();
  if (!text) throw new Error('Empty transcription returned from Whisper.');
  return text;
};

// ─── NLP system prompt (Segment 4 — exact spec) ───────────────────────────────
const NLP_SYSTEM_PROMPT = `You are a UI design command parser for a web app called Speak2Design.
Users speak commands in English, Urdu, or mixed (Roman Urdu/English) to
build web UI components on a canvas.
Your job: parse the user's command and return ONLY a valid JSON object.
No explanation, no markdown, no extra text — ONLY the JSON.
JSON Schema:
{
  "action": "add" | "delete" | "modify" | "clear" | "undo",
  "type": "navbar" | "hero" | "button" | "card" | "footer" | "form" |
          "input" | "image" | "text" | "grid" | "section" | "unknown",
  "target": "component id to modify/delete, null if adding new",
  "properties": {
    "text": "button label or heading text if mentioned",
    "color": "tailwind color class e.g. blue-500",
    "bgColor": "tailwind bg class e.g. bg-dark or bg-gray-900",
    "layout": "flex" | "grid" | "block" | null,
    "columns": number or null,
    "theme": "dark" | "light" | null,
    "size": "sm" | "md" | "lg" | null,
    "tailwindClasses": "complete tailwind class string for the component",
    "htmlTag": "div" | "nav" | "button" | "section" | "footer" | "form" etc
  },
  "confidence": 0.0 to 1.0,
  "urduDetected": true | false,
  "rawCommand": "original command text"
}
Urdu/Roman Urdu mappings you must understand:
- "banao" / "add karo" / "lagao" = add action
- "hatao" / "delete karo" / "hata do" = delete action
- "badlo" / "change karo" = modify action
- "saaf karo" / "clear karo" = clear action
- "navbar" = navbar, "button" = button, "hero section" = hero
- "dark theme" / "dark background" = bgColor: bg-gray-900, theme: dark
- "red wala" = color: red-500, "blue wala" = color: blue-500
If confidence < 0.5 or type is unknown, still return valid JSON with
action: "unknown" and confidence value.`;

/**
 * parseDesignCommand — parses a natural-language UI command into structured JSON.
 * Retries once with temperature 0 if the first attempt fails to parse.
 *
 * @param {string} transcript Raw command text (English / Urdu / mixed)
 * @returns {Promise<Object>} Structured command object matching NLP schema
 */
export const parseDesignCommand = async (transcript) => {
  const groq = getGroq();

  const attempt = async (temperature) => {
    const completion = await groq.chat.completions.create({
      model:           'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: NLP_SYSTEM_PROMPT },
        { role: 'user',   content: transcript }
      ],
      response_format: { type: 'json_object' },
      temperature,
      max_tokens: 500,
    });
    const raw    = completion.choices[0]?.message?.content?.trim() || '{}';
    const parsed = JSON.parse(raw);
    if (!parsed.action || !parsed.type) throw new Error('Missing required fields (action/type).');
    return parsed;
  };

  // Attempt 1
  try {
    return await attempt(0.3);
  } catch (err) {
    console.warn('>>> parseDesignCommand attempt 1 failed, retrying:', err.message);
  }

  // Attempt 2 — zero temperature + explicit JSON reminder in user message
  try {
    return await attempt(0.0);
  } catch (err2) {
    console.error('>>> parseDesignCommand attempt 2 failed:', err2.message);
  }

  // Graceful fallback
  return {
    action:       'unknown',
    type:         'unknown',
    target:       null,
    properties:   {},
    confidence:   0,
    urduDetected: false,
    rawCommand:   transcript
  };
};

// ─── UI generation prompt ─────────────────────────────────────────────────────
const buildUIPrompt = (textCommand, existingCanvasState) => {
  const existingTypes = existingCanvasState.map(c => c.type?.toLowerCase()).join(', ') || 'none';
  return `
You are a SENIOR PRODUCT DESIGNER and Tailwind CSS expert. You build interfaces at the
quality of Stripe, Linear, Vercel and Framer — modern, clean, spacious and premium.
Read the user's instruction (English, Urdu, or Roman-Urdu/mixed), understand the INTENT,
and return an updated canvas as JSON.

CURRENT CANVAS STATE:
${JSON.stringify(existingCanvasState, null, 2)}

EXISTING COMPONENT TYPES ON CANVAS: ${existingTypes}

USER COMMAND:
"${textCommand}"

─── STEP 1 · UNDERSTAND THE INTENT ────────────────────────────────────────────
- Commands may be short, vague, voice-transcribed, or in Urdu/Roman-Urdu. Infer the most
  sensible meaning and fill gaps with tasteful defaults — never refuse for being terse.
- Roman-Urdu / Urdu cues: "banao/add karo/lagao"=add, "hatao/delete karo"=delete,
  "badlo/change karo"=update, "saaf karo/clear karo"=clear, "dark wala"=dark theme,
  "rang/color", "bara/chhota"=size, "navbar/hero/footer/form/pricing" map directly.
- Decide ONE intent:
  • ADD    – new component not already present
  • UPDATE – modify an existing one ("make navbar dark", "hero ko blue karo")
  • DELETE – remove one ("remove footer")
  • CLEAR  – remove everything ("start fresh")
- If the user adds a type that already exists, UPDATE it instead of duplicating.
- Only ask for clarification if genuinely impossible to guess (rare).

─── STEP 2 · DESIGN AT A HIGH BAR ─────────────────────────────────────────────
Every component you output MUST look polished and intentional:
- Strong visual hierarchy: clear headings (text-4xl/5xl font-black), supporting text
  (text-gray-500), and a clear primary action.
- Generous spacing: sections use py-16 to py-24 and px-6; cards use p-6/p-8; gap-6/gap-8.
- Modern styling: rounded-2xl corners, soft shadows (shadow-sm/shadow-md/shadow-xl),
  subtle gradients (bg-gradient-to-br from-X-600 to-Y-700), hover states (hover:…).
- Cohesive palette: pick ONE accent colour family and use its shades consistently. When
  UPDATING or adding to an existing design, MATCH the existing components' colour and style.
- Responsive: use grid-cols-1 md:grid-cols-2/3, flex-col sm:flex-row where it helps.
- Real, meaningful copy — NEVER "lorem ipsum". Write believable headings, labels and CTAs.
- Accessible contrast: light text on dark backgrounds, dark text on light backgrounds.

─── STEP 3 · HTML RULES ───────────────────────────────────────────────────────
- Complete Tailwind CSS markup only; standard utility classes (no custom CSS, no <style>).
- Semantic tags: nav, header, section, footer, main, article, form.
- No external image URLs — use gradient divs, solid colour blocks, emoji or inline SVG.
- No <script>, no on* handlers, no javascript: hrefs.
- Each component must have a visible background and text so it renders on a white canvas.
- ALLOWED TYPES: navbar | hero | features | cards | form | footer | cta | pricing | testimonials | gallery | section

─── STEP 4 · RESPONSE FORMAT (JSON object with a "canvas" key) ────────────────
NORMAL RESPONSE:
{
  "canvas": [
    {
      "id": "unique-uuid-string",
      "type": "hero",
      "name": "Hero Section",
      "styles": {},
      "htmlContent": "<section class='bg-gradient-to-br from-indigo-600 to-violet-700 text-white text-center py-24 px-6'>...</section>"
    }
  ]
}

CLARIFICATION (only when truly ambiguous):
{ "clarification_needed": true, "message": "Did you mean the hero or the features section?", "canvas": [] }

CRITICAL: Preserve ALL existing components unless the user explicitly removes them — return the
full updated canvas array. Return ONLY the JSON object — no markdown, no code fences, no commentary.
`;
};

/**
 * generateUI — generates/updates Tailwind HTML canvas components from a command.
 * Two-attempt retry with decreasing temperature.
 *
 * @param {string} textCommand        Natural language design instruction
 * @param {Array}  existingCanvasState Current canvas component array
 * @returns {Promise<Array|Object>}   Updated canvas array or clarification object
 * @throws {Error}                    If both attempts fail
 */
export const generateUI = async (textCommand, existingCanvasState) => {
  const groq   = getGroq();
  const prompt = buildUIPrompt(textCommand, existingCanvasState);
  let lastError = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model:           'llama-3.3-70b-versatile',
        messages:        [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        // A touch more creativity on the first pass for richer designs; the retry
        // drops to near-deterministic to guarantee valid JSON.
        temperature:     attempt === 1 ? 0.45 : 0.1,
        max_tokens:      8192,
      });

      let text = (completion.choices[0]?.message?.content || '').trim();
      // Strip accidental markdown fences
      text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

      const parsed = JSON.parse(text);

      if (parsed.clarification_needed) return parsed;
      if (Array.isArray(parsed)) return parsed;

      // json_object mode wraps the array — check every common key
      for (const key of ['canvas', 'components', 'result', 'updatedCanvas', 'data', 'items', 'sections', 'output', 'layout']) {
        if (Array.isArray(parsed[key])) return parsed[key];
      }

      // Last resort: find the first array-valued property
      const arrayVal = Object.values(parsed).find(v => Array.isArray(v));
      if (arrayVal) return arrayVal;

      return parsed;
    } catch (err) {
      lastError = err;
      console.error(`>>> generateUI attempt ${attempt} failed:`, err.message);
    }
  }

  throw lastError;
};
