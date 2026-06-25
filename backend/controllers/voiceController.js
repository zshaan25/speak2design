import DOMPurify from 'isomorphic-dompurify';
import { randomUUID } from 'crypto';
import User from '../models/User.js';
import { transcribeAudio, generateUI } from '../services/groq.js';

const FREE_TIER_COMMAND_LIMIT = 10;
// Known semantic types (used for icons/labels). Anything else with valid HTML is
// kept and normalised to 'section' so AI output is never silently dropped (#13).
const ALLOWED_TYPES = ['navbar', 'hero', 'features', 'cards', 'form', 'footer', 'cta', 'pricing', 'testimonials', 'gallery', 'section'];
const USAGE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ─── Rolling 30-day usage window reset ───────────────────────────────────────
const loadUserWithUsageWindow = async (userId) => {
  const user = await User.findById(userId).select('usageCount tier role usageResetAt');
  if (!user) return null;
  if (!user.usageResetAt || Date.now() >= user.usageResetAt.getTime()) {
    user.usageCount  = 0;
    user.usageResetAt = new Date(Date.now() + USAGE_WINDOW_MS);
    await user.save();
  }
  return user;
};

// ─── XSS sanitization ────────────────────────────────────────────────────────
export const sanitizeHTMLContent = (html) => {
  if (!html || typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'meta', 'base'],
    ALLOW_DATA_ATTR: false
  });
};

// ─── Validate + normalise AI canvas output ───────────────────────────────────
export const sanitizeCanvas = (canvas) => {
  if (!Array.isArray(canvas)) return [];
  return canvas
    .filter(comp => comp && typeof comp === 'object')
    .map(comp => {
      const rawType = String(comp.type || '').toLowerCase();
      // Keep the known type for nice labels; otherwise normalise to 'section'
      // rather than dropping a component the AI legitimately generated (#13).
      const type = ALLOWED_TYPES.includes(rawType) ? rawType : 'section';
      const htmlContent = sanitizeHTMLContent(comp.htmlContent || '');
      // Only drop components that have no renderable HTML at all.
      if (!htmlContent.trim()) return null;
      return {
        id:          typeof comp.id === 'string' && comp.id.trim() ? comp.id : randomUUID(),
        type,
        name:        typeof comp.name === 'string' && comp.name.trim() ? comp.name.slice(0, 80) : (rawType || type),
        styles:      comp.styles && typeof comp.styles === 'object' && !Array.isArray(comp.styles) ? comp.styles : {},
        htmlContent
      };
    })
    .filter(Boolean);
};

// ─── Override detection ───────────────────────────────────────────────────────
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

// ─── commandsRemaining helper ─────────────────────────────────────────────────
const buildQuotaInfo = (user) => {
  const tier = user.tier || user.role || 'free';
  if (tier === 'premium') return 'unlimited';
  return Math.max(0, FREE_TIER_COMMAND_LIMIT - (user.usageCount || 0));
};

// ─── Friendly error messages ──────────────────────────────────────────────────
const friendlyError = (err) => {
  const msg = err.message || '';
  if (msg.includes('API key') || msg.includes('API_KEY')) return 'AI service configuration error. Contact support.';
  if (msg.includes('quota') || msg.includes('429') || msg.includes('rate'))
    return 'AI service rate limit reached. Please wait a moment and try again.';
  if (msg.includes('JSON') || msg.includes('parse')) return 'AI returned unexpected output. Rephrase your command.';
  return 'Failed to process command. Please try again.';
};

// ─── POST /api/voice/transcribe-and-generate ─────────────────────────────────
/**
 * transcribeAudioAndGenerateUI
 * Accepts a multipart audio file (or text fallback), transcribes via Groq Whisper,
 * then generates UI canvas updates via LLaMA.
 *
 * Request:
 *   multipart/form-data: audio (file), language, currentCanvas (JSON string)
 *   OR application/json: { text, language, currentCanvas }
 *
 * Response:
 *   { success, transcription, updatedCanvas, overrideNotice,
 *     ttsConfirmation, usageCount, tier, commandsRemaining }
 */
export const transcribeAudioAndGenerateUI = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Audio payload is required.' });
    }

    const freshUser = await loadUserWithUsageWindow(req.user._id);
    if (!freshUser) return res.status(401).json({ success: false, message: 'User no longer exists.' });

    const tier = freshUser.tier || freshUser.role || 'free';
    if (tier === 'free' && freshUser.usageCount >= FREE_TIER_COMMAND_LIMIT) {
      return res.status(403).json({
        success: false,
        message: `Free tier limit of ${FREE_TIER_COMMAND_LIMIT} commands reached. Upgrade to Premium.`,
        limitReached:      true,
        usageCount:        freshUser.usageCount,
        tier,
        commandsRemaining: 0
      });
    }

    const requestedLanguage = req.body.language || 'English';
    const baseCanvasState   = JSON.parse(req.body.currentCanvas || '[]');

    // Step 1 — Transcribe via Groq Whisper
    const transcription = await transcribeAudio(req.file.buffer, requestedLanguage, req.file.mimetype);
    if (!transcription?.trim()) {
      return res.status(422).json({ success: false, message: 'No speech detected. Please speak clearly and try again.' });
    }

    // Step 2 — Generate UI via Groq LLaMA
    const groqResult = await generateUI(transcription, baseCanvasState);

    if (groqResult?.clarification_needed) {
      return res.status(200).json({
        success:            true,
        clarification_needed: true,
        message:            groqResult.message,
        transcription,
        updatedCanvas:      sanitizeCanvas(Array.isArray(groqResult.canvas) ? groqResult.canvas : baseCanvasState),
        ttsConfirmation:    groqResult.message,
        usageCount:         freshUser.usageCount,
        tier,
        commandsRemaining:  buildQuotaInfo(freshUser)
      });
    }

    const safeCanvas    = sanitizeCanvas(Array.isArray(groqResult) ? groqResult : baseCanvasState);
    const overrideNotice = detectOverrideNotice(baseCanvasState, safeCanvas);

    // Increment usage counters
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $inc: { usageCount: 1, voiceCommandsToday: 1 },
        voiceCommandsDate: new Date()
      },
      { new: true }
    ).select('usageCount tier role');

    return res.status(200).json({
      success:           true,
      transcription,
      updatedCanvas:     safeCanvas,
      overrideNotice,
      ttsConfirmation:   `Command received: "${transcription}". Canvas updated successfully.`,
      usageCount:        updatedUser.usageCount,
      tier:              updatedUser.tier || updatedUser.role,
      commandsRemaining: buildQuotaInfo(updatedUser)
    });

  } catch (err) {
    console.error('>>> Voice processing failure:', err);
    return res.status(500).json({
      success: false,
      message: friendlyError(err),
      error:   process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ─── POST /api/voice/process-text-intent ─────────────────────────────────────
/**
 * processTextIntent
 * Accepts a typed text command and generates UI updates via LLaMA (no audio).
 *
 * Request body: { command, currentCanvas, language }
 * Response: { success, updatedCanvas, overrideNotice, ttsConfirmation,
 *             usageCount, tier, commandsRemaining }
 */
export const processTextIntent = async (req, res) => {
  try {
    const { command, currentCanvas } = req.body;
    if (!command?.trim()) {
      return res.status(400).json({ success: false, message: 'Command text is required.' });
    }

    const freshUser = await loadUserWithUsageWindow(req.user._id);
    if (!freshUser) return res.status(401).json({ success: false, message: 'User no longer exists.' });

    const tier = freshUser.tier || freshUser.role || 'free';
    if (tier === 'free' && freshUser.usageCount >= FREE_TIER_COMMAND_LIMIT) {
      return res.status(403).json({
        success: false,
        message: `Free tier limit of ${FREE_TIER_COMMAND_LIMIT} commands reached. Upgrade to Premium.`,
        limitReached:      true,
        usageCount:        freshUser.usageCount,
        tier,
        commandsRemaining: 0
      });
    }

    const baseCanvasState = Array.isArray(currentCanvas) ? currentCanvas : [];
    const groqResult      = await generateUI(command, baseCanvasState);

    if (groqResult?.clarification_needed) {
      return res.status(200).json({
        success:              true,
        clarification_needed: true,
        message:              groqResult.message,
        updatedCanvas:        sanitizeCanvas(Array.isArray(groqResult.canvas) ? groqResult.canvas : baseCanvasState),
        ttsConfirmation:      groqResult.message,
        usageCount:           freshUser.usageCount,
        tier,
        commandsRemaining:    buildQuotaInfo(freshUser)
      });
    }

    const safeCanvas     = sanitizeCanvas(Array.isArray(groqResult) ? groqResult : baseCanvasState);
    const overrideNotice  = detectOverrideNotice(baseCanvasState, safeCanvas);

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $inc: { usageCount: 1, voiceCommandsToday: 1 },
        voiceCommandsDate: new Date()
      },
      { new: true }
    ).select('usageCount tier role');

    return res.status(200).json({
      success:           true,
      updatedCanvas:     safeCanvas,
      overrideNotice,
      ttsConfirmation:   'Design command executed. Canvas updated successfully.',
      usageCount:        updatedUser.usageCount,
      tier:              updatedUser.tier || updatedUser.role,
      commandsRemaining: buildQuotaInfo(updatedUser)
    });

  } catch (err) {
    console.error('>>> Text processing failure:', err);
    return res.status(500).json({
      success: false,
      message: friendlyError(err),
      error:   process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
