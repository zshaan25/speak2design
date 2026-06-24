import { GoogleGenerativeAI } from '@google/generative-ai';
import DOMPurify from 'isomorphic-dompurify';
import { randomUUID } from 'crypto';
import User from '../models/User.js';

const FREE_TIER_COMMAND_LIMIT = 10;
const ALLOWED_TYPES = ['navbar', 'hero', 'features', 'cards', 'form', 'footer', 'cta', 'pricing', 'testimonials', 'gallery'];

const USAGE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ─── Load user, rolling-reset free-tier counter if the window has elapsed ─────
const loadUserWithUsageWindow = async (userId) => {
  const user = await User.findById(userId).select('usageCount tier usageResetAt');
  if (!user) return null;
  if (!user.usageResetAt || Date.now() >= user.usageResetAt.getTime()) {
    user.usageCount = 0;
    user.usageResetAt = new Date(Date.now() + USAGE_WINDOW_MS);
    await user.save();
  }
  return user;
};

// ─── Gemini client ────────────────────────────────────────────────────────────
const getGeminiModel = () => {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set.');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
};

// ─── Audio transcription via Gemini ──────────────────────────────────────────
const transcribeAudioWithGemini = async (audioBuffer, targetLanguage, mimeType = 'audio/webm') => {
  try {
    const model = getGeminiModel();
    const base64Audio = audioBuffer.toString('base64');
    // Gemini accepts the base container type; strip any codec suffix (e.g. "audio/webm;codecs=opus").
    const safeMime = (mimeType || 'audio/webm').split(';')[0];
    const langHint = targetLanguage === 'Urdu'
      ? 'The speaker is speaking in Urdu. Transcribe in Urdu script.'
      : 'The speaker is speaking in English. Transcribe exactly as spoken.';

    const result = await model.generateContent([
      { inlineData: { mimeType: safeMime, data: base64Audio } },
      `${langHint} Return ONLY the transcription text, no labels, no explanations.`
    ]);

    const text = result.response.text().trim();
    if (!text) throw new Error('Empty transcription returned from Gemini.');
    return text;
  } catch (err) {
    console.error('>>> Gemini transcription failed:', err.message);
    throw err;
  }
};

// ─── UI generation via Gemini ─────────────────────────────────────────────────
const generateUIWithGemini = async (textCommand, existingCanvasState) => {
  const existingTypes = existingCanvasState.map(c => c.type?.toLowerCase()).join(', ') || 'none';

  const prompt = `
You are an elite UI developer specializing in Tailwind CSS component architecture.
Process natural language design instructions (English, Urdu, or mixed) and return an updated canvas array.

CURRENT CANVAS STATE:
${JSON.stringify(existingCanvasState, null, 2)}

EXISTING COMPONENT TYPES ON CANVAS: ${existingTypes}

USER COMMAND:
"${textCommand}"

STRICT OPERATIONAL RULES:
1. Determine intent:
   - ADD: New component not already on canvas.
   - UPDATE: Change an existing component ("make navbar dark", "change hero to blue").
   - DELETE: Remove a component ("remove footer", "delete form").
   - CLEAR: Remove all components ("clear everything", "start fresh").

2. CONFLICT RESOLUTION:
   - If user adds a type that already exists, UPDATE the existing one instead of duplicating.
   - If command is ambiguous, return the clarification object (see format below).

3. ALLOWED TYPES: navbar | hero | features | cards | form | footer | cta | pricing | testimonials | gallery

4. HTML RULES:
   - Complete Tailwind CSS HTML only.
   - No external image URLs — use SVG placeholders or gradient divs.
   - No <script> tags, no on* event handlers, no javascript: hrefs.
   - Standard Tailwind utility classes only.
   - Semantic HTML: nav, section, footer, main, article.
   - Visually appealing with proper padding, colours, typography.

5. RESPONSE — return ONLY valid JSON (no markdown, no code fences, no comments):

NORMAL RESPONSE:
[
  {
    "id": "unique-uuid-string",
    "type": "navbar",
    "name": "Navigation Bar",
    "styles": {},
    "htmlContent": "<nav class='bg-slate-900 text-white px-6 py-4'>...</nav>"
  }
]

CLARIFICATION NEEDED:
{
  "clarification_needed": true,
  "message": "Did you mean the hero section or the features section?",
  "canvas": <existing canvas array>
}

IMPORTANT: Preserve ALL existing components unless user explicitly asks to remove them.
Return ONLY the JSON — no other text.
`;

  let lastError = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const model = getGeminiModel();
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: attempt === 1 ? 0.2 : 0.0
        }
      });

      let responseText = result.response.text().trim();

      // Strip markdown fences if model ignores responseMimeType
      responseText = responseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const parsed = JSON.parse(responseText);

      if (parsed.clarification_needed) return parsed;
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed.canvas)) return parsed.canvas;
      if (Array.isArray(parsed.components)) return parsed.components;
      return parsed;

    } catch (err) {
      lastError = err;
      console.error(`>>> Gemini UI generation attempt ${attempt} failed:`, err.message);
    }
  }

  throw lastError;
};

// ─── XSS sanitization (DOMPurify — strips scripts, event handlers, js: URLs) ──
export const sanitizeHTMLContent = (html) => {
  if (!html || typeof html !== 'string') return '';
  // DOMPurify already strips <script>, on* handlers and javascript: URLs by default.
  // We additionally forbid embedding/navigation tags that have no place in a UI mockup.
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'meta', 'base'],
    ALLOW_DATA_ATTR: false
  });
};

// ─── Validate + normalise AI component output (drops malformed/unsafe items) ──
export const sanitizeCanvas = (canvas) => {
  if (!Array.isArray(canvas)) return [];
  return canvas
    .filter(comp => comp && typeof comp === 'object')
    .map(comp => {
      const type = String(comp.type || '').toLowerCase();
      if (!ALLOWED_TYPES.includes(type)) return null;
      return {
        id: typeof comp.id === 'string' && comp.id.trim() ? comp.id : randomUUID(),
        type,
        name: typeof comp.name === 'string' && comp.name.trim() ? comp.name.slice(0, 80) : type,
        styles: comp.styles && typeof comp.styles === 'object' && !Array.isArray(comp.styles) ? comp.styles : {},
        htmlContent: sanitizeHTMLContent(comp.htmlContent || '')
      };
    })
    .filter(Boolean);
};

// ─── FR_06: detect when a command overrode an existing component of same type ─
const detectOverrideNotice = (before, after) => {
  if (!Array.isArray(before) || !Array.isArray(after)) return null;
  const beforeByType = new Map(before.map(c => [String(c.type || '').toLowerCase(), c]));
  for (const comp of after) {
    const type = String(comp.type || '').toLowerCase();
    const prev = beforeByType.get(type);
    if (!prev) continue;
    const changed =
      (prev.htmlContent || '') !== (comp.htmlContent || '') ||
      JSON.stringify(prev.styles || {}) !== JSON.stringify(comp.styles || {});
    if (changed) return `Previous ${type} settings were overridden by your latest command.`;
  }
  return null;
};

// ─── Friendly error messages ──────────────────────────────────────────────────
const friendlyError = (err) => {
  const msg = err.message || '';
  if (msg.includes('API key') || msg.includes('API_KEY')) return 'AI service configuration error. Contact support.';
  if (msg.includes('quota') || msg.includes('429'))       return 'AI service quota exceeded. Try again later.';
  if (msg.includes('JSON') || msg.includes('parse'))      return 'AI returned unexpected output. Rephrase your command.';
  return 'Failed to process command. Please try again.';
};

// ─── Voice: Transcribe audio → Generate UI ───────────────────────────────────
export const transcribeAudioAndGenerateUI = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Audio payload is required.' });
    }

    const freshUser = await loadUserWithUsageWindow(req.user._id);
    if (!freshUser) return res.status(401).json({ success: false, message: 'User no longer exists.' });
    if (freshUser.tier === 'free' && freshUser.usageCount >= FREE_TIER_COMMAND_LIMIT) {
      return res.status(403).json({
        success: false,
        message: `Free tier limit of ${FREE_TIER_COMMAND_LIMIT} commands reached. Upgrade to Premium.`,
        limitReached: true,
        usageCount: freshUser.usageCount,
        tier: freshUser.tier
      });
    }

    const requestedLanguage = req.body.language || 'English';
    const baseCanvasState = JSON.parse(req.body.currentCanvas || '[]');

    // Step 1: Transcribe audio
    const transcription = await transcribeAudioWithGemini(req.file.buffer, requestedLanguage, req.file.mimetype);
    if (!transcription?.trim()) {
      return res.status(422).json({ success: false, message: 'No speech detected. Please speak clearly and try again.' });
    }

    // Step 2: Generate UI
    const geminiResult = await generateUIWithGemini(transcription, baseCanvasState);

    // Clarification response
    if (geminiResult?.clarification_needed) {
      return res.status(200).json({
        success: true,
        clarification_needed: true,
        message: geminiResult.message,
        transcription,
        updatedCanvas: sanitizeCanvas(Array.isArray(geminiResult.canvas) ? geminiResult.canvas : baseCanvasState),
        ttsConfirmation: geminiResult.message,
        usageCount: freshUser.usageCount,
        tier: freshUser.tier
      });
    }

    const safeCanvas = sanitizeCanvas(Array.isArray(geminiResult) ? geminiResult : baseCanvasState);
    const overrideNotice = detectOverrideNotice(baseCanvasState, safeCanvas);

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { usageCount: 1 } },
      { new: true }
    ).select('usageCount tier');

    return res.status(200).json({
      success: true,
      transcription,
      updatedCanvas: safeCanvas,
      overrideNotice,
      ttsConfirmation: `Command received: "${transcription}". Canvas updated successfully.`,
      usageCount: updatedUser.usageCount,
      tier: updatedUser.tier
    });

  } catch (err) {
    console.error('>>> Voice processing failure:', err);
    return res.status(500).json({
      success: false,
      message: friendlyError(err),
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ─── Text command → Generate UI ──────────────────────────────────────────────
export const processTextIntent = async (req, res) => {
  try {
    const { command, currentCanvas } = req.body;
    if (!command?.trim()) {
      return res.status(400).json({ success: false, message: 'Command text is required.' });
    }

    const freshUser = await loadUserWithUsageWindow(req.user._id);
    if (!freshUser) return res.status(401).json({ success: false, message: 'User no longer exists.' });
    if (freshUser.tier === 'free' && freshUser.usageCount >= FREE_TIER_COMMAND_LIMIT) {
      return res.status(403).json({
        success: false,
        message: `Free tier limit of ${FREE_TIER_COMMAND_LIMIT} commands reached. Upgrade to Premium.`,
        limitReached: true,
        usageCount: freshUser.usageCount,
        tier: freshUser.tier
      });
    }

    const baseCanvasState = Array.isArray(currentCanvas) ? currentCanvas : [];
    const geminiResult = await generateUIWithGemini(command, baseCanvasState);

    if (geminiResult?.clarification_needed) {
      return res.status(200).json({
        success: true,
        clarification_needed: true,
        message: geminiResult.message,
        updatedCanvas: sanitizeCanvas(Array.isArray(geminiResult.canvas) ? geminiResult.canvas : baseCanvasState),
        ttsConfirmation: geminiResult.message,
        usageCount: freshUser.usageCount,
        tier: freshUser.tier
      });
    }

    const safeCanvas = sanitizeCanvas(Array.isArray(geminiResult) ? geminiResult : baseCanvasState);
    const overrideNotice = detectOverrideNotice(baseCanvasState, safeCanvas);

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { usageCount: 1 } },
      { new: true }
    ).select('usageCount tier');

    return res.status(200).json({
      success: true,
      updatedCanvas: safeCanvas,
      overrideNotice,
      ttsConfirmation: 'Design command executed. Canvas updated successfully.',
      usageCount: updatedUser.usageCount,
      tier: updatedUser.tier
    });

  } catch (err) {
    console.error('>>> Text processing failure:', err);
    return res.status(500).json({
      success: false,
      message: friendlyError(err),
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
