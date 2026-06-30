# Speak2Design

Voice-driven UI design tool. Speak (or type) a layout command in **English or Urdu** and an AI agent generates production-ready HTML + Tailwind CSS components on a live canvas. Export the result, reorder layers, and publish/buy templates in a marketplace.

Final Year Project — BS Computer Science.

## Architecture

| Layer | Stack |
|-------|-------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Radix UI, Framer Motion |
| Backend | Node.js, Express, Mongoose (MongoDB) |
| AI | **Groq** — Whisper (`whisper-large-v3`) for audio transcription + LLaMA 3.3 70B for UI generation |
| Auth | JWT (7-day) + bcrypt password hashing |

```
src/                 React frontend (App.tsx routes between screens)
backend/
  controllers/       auth, voice (AI), project, marketplace
  models/            User, Project, Template
  routes/            /api/auth, /api/voice, /api/projects, /api/marketplace
  middleware/        requireAuthentication (JWT)
```

## How it works

1. User clicks the mic and speaks a command (e.g. *"add a hero section with a dark gradient"*); recording auto-stops on silence.
2. Audio is sent to `/api/voice/transcribe-and-generate`.
3. Groq Whisper transcribes the audio, then LLaMA 3.3 generates/updates a canvas array of components.
4. AI output is **sanitized with DOMPurify** server-side and validated against an allowed component schema before being returned.
5. Frontend renders the sanitized HTML on the canvas; user can reorder, delete, undo/redo, save, and export.

## Running locally

### Prerequisites
- Node.js 18+
- A MongoDB connection string
- A Groq API key (free at https://console.groq.com)

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in the values below
npm run dev            # starts on http://127.0.0.1:5000
```

Required `backend/.env`:
```
MONGODB_URI=<your mongodb connection string>
JWT_SECRET=<long random string, 32+ chars>
GROQ_API_KEY=<your groq api key>
FRONTEND_URL=http://localhost:5173
PORT=5000
NODE_ENV=development
```

### Frontend
```bash
npm install
npm run dev            # starts on http://localhost:5173
```

Optional frontend `.env`:
```
VITE_API_URL=http://127.0.0.1:5000
```

## Security notes
- AI-generated HTML is sanitized with DOMPurify on both server and client (defense-in-depth) before any `dangerouslySetInnerHTML` render.
- Component output is schema-validated against an allow-list of component types.
- Passwords are bcrypt-hashed; auth uses signed JWTs. The server refuses to boot without `JWT_SECRET` and `MONGODB_URI`.

## Deployment
See [DEPLOYMENT.md](DEPLOYMENT.md). Frontend → AWS S3 + CloudFront, backend → Render.
