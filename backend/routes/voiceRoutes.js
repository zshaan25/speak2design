import express from 'express';
import multer from 'multer';
import { requireAuthentication } from '../middleware/auth.js';
import { transcribeAudioAndGenerateUI, processTextIntent } from '../controllers/voiceController.js';

const router = express.Router();

// Memory buffer for audio uploads — 25MB limit (Whisper API maximum)
const uploadStorageConfig = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mpeg', 'audio/mp4'];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(webm|ogg|wav|mp3|mp4|m4a)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio file format. Use webm, wav, or mp3.'));
    }
  }
});

// Simple in-memory rate limiter: max 30 voice requests per user per minute.
// NOTE: state is per-process — on a multi-instance deploy (or after a restart)
// the window resets. For production scale, move this to Redis or a shared store.
const voiceRateLimiter = (() => {
  const requests = new Map();
  const WINDOW_MS = 60 * 1000; // 1 minute
  const MAX_REQUESTS = 30;

  return (req, res, next) => {
    const userId = req.user?._id?.toString();
    if (!userId) return next();

    const now = Date.now();
    const userRequests = requests.get(userId) || [];
    const recentRequests = userRequests.filter(t => now - t < WINDOW_MS);

    if (recentRequests.length >= MAX_REQUESTS) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please wait a moment before sending another command.'
      });
    }

    recentRequests.push(now);
    requests.set(userId, recentRequests);

    // Cleanup old entries every 100 requests
    if (requests.size > 100) {
      for (const [uid, times] of requests.entries()) {
        if (times.every(t => now - t > WINDOW_MS)) requests.delete(uid);
      }
    }

    next();
  };
})();

router.post(
  '/transcribe-and-generate',
  requireAuthentication,
  voiceRateLimiter,
  uploadStorageConfig.single('audio'),
  transcribeAudioAndGenerateUI
);

router.post(
  '/process-text-intent',
  requireAuthentication,
  voiceRateLimiter,
  processTextIntent
);

export default router;
