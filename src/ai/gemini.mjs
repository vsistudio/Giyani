export class VerosAIError extends Error {
  constructor(message, code = 'AI_ERROR') {
    super(message);
    this.name = 'VerosAIError';
    this.code = code;
  }
}

export function resolveGeminiConfig(settings = {}) {
  const runtime = window.VEROS_CONFIG || {};
  return {
    key: runtime.GEMINI_API_KEY || window.VEROS_GEMINI_API_KEY || '',
    model: runtime.GEMINI_MODEL || settings.model || 'gemini-1.5-flash',
  };
}

export function buildSpokenPrompt(input, conversation, settings) {
  const history = (conversation?.turns || [])
    .slice(-10)
    .map((turn) => `${turn.role === 'user' ? 'User' : 'VEROS'}: ${turn.text}`)
    .join('\n');

  return [
    'You are VEROS, a voice-only AI assistant.',
    'Reply for spoken delivery: clear, concise, calm, natural, and useful.',
    `Voice style: ${settings.style}.`,
    'Maintain conversational context. Do not format as a chatbot transcript.',
    history,
    `User: ${input}`,
    'VEROS:',
  ]
    .filter(Boolean)
    .join('\n');
}

export async function generateVerosResponse(input, conversation, settings) {
  const { key, model } = resolveGeminiConfig(settings);

  if (!key) {
    throw new VerosAIError(
      'Gemini is not configured. Add a server proxy or inject a restricted prototype key at runtime.',
      'CONFIG',
    );
  }

  const prompt = buildSpokenPrompt(input, conversation, settings);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(key)}`;

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: settings.creativity },
      }),
    });
  } catch {
    throw new VerosAIError('Network connection failed while contacting Gemini.', 'NETWORK');
  }

  if (!response.ok) {
    throw new VerosAIError(`Gemini request failed with status ${response.status}.`, 'REQUEST');
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim();

  if (!text) {
    throw new VerosAIError('VEROS received an empty response.', 'EMPTY');
  }

  return text;
}
