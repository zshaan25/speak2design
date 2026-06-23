# Functional Requirements — Compliance Matrix

Maps each functional requirement (FR_01–FR_10) to its implementation. Paths are relative to the repo root.

> **Engine note:** the requirements text names *Whisper + GPT-4*. The implemented system uses **Google Gemini 2.0 Flash**, which performs **both** audio transcription and structured UI generation through a single API. This was a deliberate engineering choice (one provider, free tier for development, native multimodal audio) and fully satisfies the *capability* described in FR_01–FR_03 (multilingual transcription + AI UI generation). All "Whisper/GPT-4" references should be read as "the AI engine (Gemini)".

| FR | Requirement | Status | Where implemented |
|----|-------------|--------|-------------------|
| FR_01 | Voice command processing (EN/UR/mixed) | ✅ Done | `Workspace.tsx` (MediaRecorder) → `voiceController.transcribeAudioAndGenerateUI` |
| FR_02 | Multilingual speech recognition | ✅ Done | `transcribeAudioWithGemini` with language hint; prompt accepts mixed input |
| FR_03 | AI UI component generation (Tailwind) | ✅ Done | `generateUIWithGemini` (structured prompt, JSON output) |
| FR_04 | Ambiguity handling & error recovery | ✅ Done | clarification path + `friendlyError`; canvas preserved on failure; toasts |
| FR_05 | Drag-and-drop editor (reorder + resize/style) | ✅ Done | `Workspace.tsx`: layer drag-reorder + Inspector width/align/spacing controls |
| FR_06 | Voice command conflict resolution + override notice | ✅ Done | `detectOverrideNotice` (backend) → toast + TTS (frontend); history records both states |
| FR_07 | Real-time voice feedback (TTS) | ✅ Done | `speakTTS` (Web Speech Synthesis), language-aware (`ur-PK`/`en-US`) |
| FR_08 | Text command processing | ✅ Done | `processTextIntent` (same AI pipeline, no transcription) |
| FR_09 | Freemium access control | ✅ Done | quota window (`loadUserWithUsageWindow`); **Premium-gated** export downloads + marketplace publishing; one-click upgrade (`/api/auth/upgrade`) |
| FR_10 | Template marketplace + payment gateway | ✅ Done | publish (uniqueness check, Premium-only), purchase → **Stripe test-mode** PaymentIntent (`createPaymentIntent`) with simulated fallback; ownership recorded in `User.ownedTemplates` (library) |

## Security & quality additions (beyond FR)
- AI HTML output sanitized with **DOMPurify** server + client (defense-in-depth) before any `dangerouslySetInnerHTML`.
- AI output **schema-validated** against an allow-list of component types.
- JWT auth with bcrypt password hashing; server refuses to boot without `JWT_SECRET`/`MONGODB_URI`.
- Backend unit tests (`npm test`) covering the sanitizer + schema validation.
- gzip compression + MongoDB index on the hot project query (resource optimization).

## Free vs Premium (FR_09)
| Capability | Free | Premium |
|------------|------|---------|
| Voice/text commands | 10 per 30-day window | Unlimited |
| Copy exported code | ✅ | ✅ |
| Download HTML/CSS files | ❌ (upgrade prompt) | ✅ |
| Buy templates | ✅ | ✅ |
| Publish templates | ❌ (upgrade prompt) | ✅ |
