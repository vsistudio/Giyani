import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { defaultSettings, titleFromSpeech } from '../state/storage.mjs';

assert.equal(defaultSettings.model.includes('gemini'), true);
assert.equal(defaultSettings.memory, true);
assert.equal(defaultSettings.recording, true);
assert.equal(titleFromSpeech('Who is Elon Musk and why'), 'Who is Elon Musk and why');

const html = readFileSync('index.html', 'utf8');
assert.match(html, /Speak to VEROS/);
assert.match(html, /Voice Memory/);
assert.match(html, /Clear memory/);
assert.match(html, /aria-live="polite"/);

const main = readFileSync('src/main.mjs', 'utf8');
assert.match(main, /replaceChildren/);
assert.doesNotMatch(main, /innerHTML/);
assert.match(main, /addEventListener\('offline'/);
assert.match(main, /stopSpeaking/);

const audio = readFileSync('src/audio/audioEngine.mjs', 'utf8');
assert.match(audio, /getUserMedia/);
assert.match(audio, /SpeechSynthesisUtterance/);
assert.match(audio, /track\.stop\(\)/);

const ai = readFileSync('src/ai/gemini.mjs', 'utf8');
assert.match(ai, /\/api\/gemini/);
assert.doesNotMatch(ai, /GEMINI_API_KEY/);
assert.match(ai, /Network connection failed/);

const functionCode = readFileSync('functions/api/gemini.js', 'utf8');
assert.match(functionCode, /onRequestPost/);
assert.match(functionCode, /env\.GEMINI_API_KEY/);
assert.match(functionCode, /MAX_INPUT_CHARS/);
assert.match(functionCode, /Cross-origin requests are not allowed/);
assert.match(functionCode, /generateContent/);

console.log('VEROS production deployment tests passed');
