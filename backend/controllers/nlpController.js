import { parseDesignCommand } from '../services/groq.js';

/**
 * parseCommand — POST /api/nlp/parse
 * Parses a natural-language design command (English / Urdu / mixed) into
 * structured JSON using Groq LLaMA.
 *
 * Request body:
 *   { transcript: string }  — text from voice transcription
 *   { text: string }        — direct typed input
 *
 * Response:
 *   {
 *     success: true,
 *     command: { action, type, target, properties, confidence, urduDetected, rawCommand },
 *     warning?: string   — included if confidence < 0.5
 *   }
 *
 * Sample request:
 *   POST /api/nlp/parse
 *   Authorization: Bearer <token>
 *   { "transcript": "dark navbar banao" }
 *
 * Sample response:
 *   {
 *     "success": true,
 *     "command": {
 *       "action": "add",
 *       "type": "navbar",
 *       "target": null,
 *       "properties": { "theme": "dark", "bgColor": "bg-gray-900", "tailwindClasses": "..." },
 *       "confidence": 0.92,
 *       "urduDetected": true,
 *       "rawCommand": "dark navbar banao"
 *     }
 *   }
 */
export const parseCommand = async (req, res, next) => {
  try {
    const input = (req.body.transcript || req.body.text || '').trim();
    if (!input) {
      return res.status(400).json({
        success: false,
        message: 'Provide "transcript" or "text" in the request body.'
      });
    }

    const command  = await parseDesignCommand(input);
    const response = { success: true, command };

    if (typeof command.confidence === 'number' && command.confidence < 0.5) {
      response.warning = `Low confidence (${command.confidence.toFixed(2)}) — the command may not have been understood correctly. Please rephrase your instruction.`;
    }

    return res.status(200).json(response);
  } catch (err) {
    console.error('>>> NLP parse error:', err);
    next(err);
  }
};
