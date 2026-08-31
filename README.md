# VEROS — Intelligence, spoken.

VEROS is a voice-only AI assistant experience: the user speaks, VEROS listens, reasons with Gemini, and responds using natural browser speech synthesis. The primary interface is an audio-reactive intelligence core rather than chatbot text.

## Architecture

- `src/audio`: microphone, Web Speech recognition, speech synthesis, interruption, and media-track cleanup.
- `src/ai`: modular Gemini response service using the public REST interface.
- `src/main.mjs`: conversation orchestration and VEROS state machine.
- `src/state`: local voice-memory metadata and settings persistence.
- `src/styles`: responsive visual system, motion, focus states, and reduced-motion support.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

This project intentionally has no package dependencies. The `npm install` command creates the normal npm metadata if your deployment platform expects it.

## Environment variables

```env
VEROS_GEMINI_API_KEY=your_google_ai_studio_key
VEROS_GEMINI_MODEL=gemini-1.5-flash
```

For production, proxy Gemini calls through a server or edge function so secrets are not shipped to browsers. For local prototype testing, inject a restricted key at runtime before `src/main.mjs` loads:

```html
<script>window.VEROS_GEMINI_API_KEY = "restricted-prototype-key";</script>
```

Do not commit real API keys.

## Commands

```bash
npm run dev
npm run build
npm run preview
npm run test
```

## Browser requirements and limitations

- Speech recognition is browser-dependent; Chrome and Edge provide the best support.
- Browsers cannot provide reliable always-on background wake-word listening. VEROS only listens after explicit user action in the web app.
- Voice availability depends on the host operating system and browser.
- Conversation data is local browser storage metadata. This implementation does not claim cloud sync or end-to-end encryption.

## Privacy and security

VEROS shows a visible listening state, requests microphone access only after user action, stops media tracks after recognition, and provides controls to delete local conversation memory. A production deployment should move Gemini calls behind a server-controlled API route to protect credentials.
