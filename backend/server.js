// ── MUST be the very first import so process.env is populated before ANY other
// module (oauthController, voiceController, etc.) reads it at load time.
// In ESM all imports are hoisted, but they are evaluated left-to-right, so
// listing 'dotenv/config' first guarantees it runs before the route modules.
import 'dotenv/config';

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import compression from 'compression';

import authRoutes from './routes/authRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import marketplaceRoutes from './routes/marketplaceRoutes.js';
import pageRoutes from './routes/pageRoutes.js';
const app = express();

// ─── CORS — allow localhost dev + production Vercel URL ───────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://speak2design.vercel.app',
  // Add your custom domain here if you have one
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, mobile apps, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true
}));

// gzip responses to cut bandwidth (resource optimization).
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'active',
    system: 'Speak2Design Core Engine',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/marketplace', marketplaceRoutes);
// Page routes are mounted at /api so the full path is /api/projects/:id/pages/…
app.use('/api', pageRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('>>> Unhandled error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ─── Database + Server Start ──────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 5000;

if (!MONGODB_URI) {
  console.error('>>> FATAL: MONGODB_URI environment variable is not set.');
  process.exit(1);
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error('>>> FATAL: JWT_SECRET is not set or too weak. Set a long random secret (32+ chars).');
  process.exit(1);
}

if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('YOUR_')) {
  console.warn('>>> WARNING: GEMINI_API_KEY is not set or is a placeholder. Voice and AI features will fail.');
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('>>> MongoDB connected successfully.');
    app.listen(PORT, () => {
      console.log(`>>> Speak2Design backend running on port ${PORT}`);
      console.log(`>>> Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((err) => {
    console.error('>>> MongoDB connection failed:', err.message);
    process.exit(1);
  });
