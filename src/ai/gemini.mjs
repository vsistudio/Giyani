export class VerosAIError extends Error {
  constructor(message, code = 'AI_ERROR') {
    super(message);
    this.name = 'VerosAIError';
    this.code = code;
  }
}

export async function generateVerosResponse(input, conversation, settings) {
  let response;
  try {
    response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, conversation, settings }),
    });
  } catch {
    throw new VerosAIError('Network connection failed while contacting VEROS.', 'NETWORK');
  }

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    throw new VerosAIError('VEROS received an invalid response from the AI service.', 'INVALID_JSON');
  }

  if (!response.ok) {
    throw new VerosAIError(payload.error || `AI request failed with status ${response.status}.`, 'REQUEST');
  }

  const text = String(payload.text || '').trim();
  if (!text) {
    throw new VerosAIError('VEROS received an empty response.', 'EMPTY');
  }

  return text;
}
