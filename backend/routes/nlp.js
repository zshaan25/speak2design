import express from 'express';
import { requireAuthentication } from '../middleware/auth.js';
import { parseCommand } from '../controllers/nlpController.js';

const router = express.Router();

/**
 * POST /api/nlp/parse
 * Parse a natural-language design command into structured JSON.
 * Body: { transcript } or { text }
 */
router.post('/parse', requireAuthentication, parseCommand);

export default router;
