# VEROS — Intelligence, spoken.

VEROS is a production-oriented voice-only AI assistant web app. The user speaks, VEROS listens through browser speech recognition, sends the request to a Cloudflare Pages Function, receives a Gemini response, and speaks it with browser speech synthesis. The primary interface is an audio-reactive intelligence core rather than a chatbot transcript.

## Architecture

- `index.html`: voice-first application shell, controls, memory panel, settings panel, and accessible live state region.
- `src/main.mjs`: conversation orchestration, listening/thinking/speaking/error state machine, settings, local memory, deletion, and offline handling.
- `src/audio/audioEngine.mjs`: microphone permission, Web Speech recognition, speech synthesis, interruption, and media-track cleanup.
- `src/ai/gemini.mjs`: browser client for the same-origin `/api/gemini` endpoint.
- `functions/api/gemini.js`: Cloudflare Pages Function that keeps the Gemini API key server-side, validates requests, builds the spoken prompt, and calls Gemini.
- `src/state/storage.mjs`: local settings and voice-memory metadata persistence.
- `src/styles/veros.css`: responsive visual system, focus states, motion, reduced-motion support, and the VEROS intelligence core.

## Cloudflare Pages deployment

Use these settings in Cloudflare Pages:

```txt
Framework preset: None
Root directory: /
Install command: npm install
Build command: npm run build
Build output directory: dist
```

Add these Cloudflare Pages variables/secrets:

```env
GEMINI_API_KEY=your_google_ai_studio_key
GEMINI_MODEL=gemini-1.5-flash
NODE_VERSION=20
```

`GEMINI_API_KEY` must be configured in Cloudflare, not committed to git. The frontend never needs the Gemini key because it calls the same-origin Pages Function at `/api/gemini`.

## Local development

```bash
npm install
npm run dev
```

The local zero-dependency development server serves the static frontend. For local end-to-end Gemini testing, run with a Cloudflare Pages-compatible dev environment such as Wrangler/Pages Functions or deploy a preview to Cloudflare Pages with the variables above.

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

VEROS shows a visible listening state, requests microphone access only after user action, stops media tracks after recognition, and provides controls to delete local conversation memory. Gemini credentials stay in the Cloudflare Pages Function environment and are never stored in frontend code or localStorage.
