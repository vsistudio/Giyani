const MAX_INPUT_CHARS = 12000;
const DEFAULT_MODEL = 'gemini-1.5-flash';
const ALLOWED_ORIGINS = new Set(['same-origin']);

class HttpError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function assertSameOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return;
  const requestUrl = new URL(request.url);
  if (origin === requestUrl.origin) return;
  if (ALLOWED_ORIGINS.has(origin)) return;
  throw new HttpError('Cross-origin requests are not allowed.', 403);
}

function sanitizeTurn(turn) {
  const role = turn?.role === 'veros' ? 'veros' : 'user';
  const text = String(turn?.text || '').slice(0, MAX_INPUT_CHARS);
  return { role, text };
}

function buildPrompt({ input, conversation, settings }) {
  const history = (conversation?.turns || [])
    .slice(-10)
    .map(sanitizeTurn)
    .filter((turn) => turn.text.trim())
    .map((turn) => `${turn.role === 'user' ? 'User' : 'VEROS'}: ${turn.text}`)
    .join('\n');

  return [
    'You are VEROS, a voice-only AI assistant.',
    'Reply for spoken delivery: clear, concise, calm, natural, and useful.',
    `Voice style: ${settings?.style || 'Calm'}.`,
    'Maintain conversational context. Do not format as a chatbot transcript.',
    history,
    `User: ${String(input || '').slice(0, MAX_INPUT_CHARS)}`,
    'VEROS:',
  ]
    .filter(Boolean)
    .join('\n');
}

async function parsePayload(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    throw new HttpError('Request body must be valid JSON.', 400);
  }

  const input = String(payload?.input || '').trim();
  if (!input) throw new HttpError('Input speech is empty.', 400);
  if (input.length > MAX_INPUT_CHARS) throw new HttpError('Input speech is too long.', 413);

  return {
    input,
    conversation: payload.conversation || null,
    settings: payload.settings || {},
  };
}

export async function onRequestPost({ request, env }) {
  try {
    assertSameOrigin(request);
    if (!env.GEMINI_API_KEY) throw new HttpError('Gemini API key is not configured.', 500);

    const payload = await parsePayload(request);
    const model = env.GEMINI_MODEL || payload.settings.model || DEFAULT_MODEL;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;

    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: buildPrompt(payload) }] }],
        generationConfig: {
          temperature: Number(payload.settings.creativity ?? 0.55),
        },
      }),
    });

    if (!upstream.ok) {
      return json({ error: `Gemini request failed with status ${upstream.status}.` }, upstream.status);
    }

    const data = await upstream.json();
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim();

    if (!text) throw new HttpError('Gemini returned an empty response.', 502);
    return json({ text, model });
  } catch (error) {
    const status = error.status || 500;
    return json({ error: error.message || 'VEROS could not reach Gemini.' }, status);
  }
}

export async function onRequestGet() {
  return json({ status: 'ok', service: 'veros-gemini' });
}
