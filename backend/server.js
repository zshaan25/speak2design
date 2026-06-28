// ── MUST be the very first import so process.env is populated before ANY other
// module reads it at load time. In ESM imports are evaluated left-to-right.
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';

import connectDB from './config/db.js';
import { globalErrorHandler } from './middleware/error.js';
import { seedDefaultTemplates } from './controllers/marketplaceController.js';

import authRoutes        from './routes/authRoutes.js';
import voiceRoutes       from './routes/voiceRoutes.js';
import nlpRoutes         from './routes/nlp.js';
import projectRoutes     from './routes/projectRoutes.js';
import designRoutes      from './routes/designs.js';
import marketplaceRoutes from './routes/marketplaceRoutes.js';
import pageRoutes        from './routes/pageRoutes.js';
import dashboardRoutes   from './routes/dashboard.js';

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://speak2design.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true
}));

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(compression());
// Morgan: 'dev' in development, 'combined' in production
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Stripe webhook needs raw body — mount BEFORE express.json() ───────────────
// (imported inside marketplaceRoutes.js with express.raw on that specific route)
app.use('/api/marketplace/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Health Check (Segment 1 — must be at /api/health) ───────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server running',
    system: 'Speak2Design Core Engine',
    version: '2.0.0',
    timestamp: Date.now(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Legacy health check — kept so existing monitors don't break
app.get('/health', (req, res) => res.redirect('/api/health'));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/voice',       voiceRoutes);
app.use('/api/nlp',         nlpRoutes);
app.use('/api/projects',    projectRoutes);
app.use('/api/designs',     designRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/dashboard',   dashboardRoutes);
// Page routes mounted at /api so full path is /api/projects/:id/pages/…
app.use('/api',             pageRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ─── Global Error Handler (Segment 1) ────────────────────────────────────────
app.use(globalErrorHandler);

// ─── Crash diagnostics ───────────────────────────────────────────────────────
// Log the full stack for any async error that escapes a route, instead of the
// process dying with no usable output. In dev we keep running so one bad request
// doesn't take the whole server down.
process.on('unhandledRejection', (reason) => {
  console.error('>>> UNHANDLED REJECTION:', reason instanceof Error ? reason.stack : reason);
});
process.on('uncaughtException', (err) => {
  console.error('>>> UNCAUGHT EXCEPTION:', err.stack || err);
  if (process.env.NODE_ENV === 'production') process.exit(1);
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error('>>> FATAL: JWT_SECRET is not set or too weak (min 16 chars).');
  process.exit(1);
}

if (!process.env.GROQ_API_KEY) {
  console.warn('>>> WARNING: GROQ_API_KEY is not set. Voice and AI features will fail.');
}

connectDB().then(async () => {

  // Seed demo marketplace templates on an empty DB (idempotent).
  try { await seedDefaultTemplates(); } catch (e) { console.warn('>>> Template seed skipped:', e.message); }

  app.listen(PORT, () => {
    console.log(`[Speak2Design] Server live on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
}).catch(err => {
  console.error('>>> DB connection failed:', err.message);
  process.exit(1);
});
