import { AudioEngine } from './audio/audioEngine.mjs';
import { generateVerosResponse } from './ai/gemini.mjs';
import {
  createConversation,
  loadConversations,
  loadSettings,
  saveConversations,
  saveSettings,
  titleFromSpeech,
} from './state/storage.mjs';

const $ = (selector) => document.querySelector(selector);
const busyStates = new Set(['listening', 'thinking', 'speaking']);
const labels = {
  idle: 'Ready',
  listening: 'Listening',
  thinking: 'Reasoning',
  speaking: 'Speaking',
  offline: 'Offline',
  error: 'Attention needed',
};

const engine = new AudioEngine();
let settings = loadSettings();
let conversations = loadConversations();
let active = conversations[0] || createConversation(settings.model);
let state = navigator.onLine ? 'idle' : 'offline';

if (!conversations.length) conversations = [active];

function setState(nextState, level = 0) {
  state = nextState;
  $('#core').className = `core ${nextState}`;
  $('#stateLabel').textContent = labels[nextState];
  $('.orb').style.setProperty('--level', String(level));
  $('#talk').textContent = busyStates.has(nextState) ? '■' : '●';
  $('#talk').ariaLabel = busyStates.has(nextState) ? 'Stop VEROS' : 'Speak to VEROS';
}

function persist() {
  saveSettings(settings);
  saveConversations(conversations);
  renderMemory();
}

function patchActive(updater) {
  active = updater(active);
  conversations = conversations.map((conversation) =>
    conversation.id === active.id ? active : conversation,
  );
  persist();
}

function buildMemoryElement(conversation) {
  const article = document.createElement('article');
  article.className = `memory ${conversation.id === active.id ? 'active' : ''}`;

  const open = document.createElement('button');
  open.dataset.open = conversation.id;
  const title = document.createElement('strong');
  title.textContent = conversation.title;
  const meta = document.createElement('small');
  meta.textContent = `${new Date(conversation.updatedAt).toLocaleString()} · ${conversation.turns.length} turns · ${Math.round(conversation.durationMs / 1000)}s`;
  open.append(title, meta);

  const del = document.createElement('button');
  del.dataset.del = conversation.id;
  del.ariaLabel = `Delete ${conversation.title}`;
  del.textContent = 'Delete';

  article.append(open, del);
  return article;
}

function renderMemory() {
  const root = $('#memories');
  root.replaceChildren(...conversations.map(buildMemoryElement));
}

function renderSettings() {
  const mappings = [
    ['rate', 'rate'],
    ['volume', 'volume'],
    ['style', 'style'],
    ['model', 'model'],
    ['memoryToggle', 'memory'],
    ['recording', 'recording'],
  ];

  for (const [id, key] of mappings) {
    const input = $(`#${id}`);
    if (input.type === 'checkbox') input.checked = settings[key];
    else input.value = settings[key];
  }

  const voiceSelect = $('#voiceSelect');
  const voiceOptions = speechSynthesis.getVoices().map((voice) => {
    const option = document.createElement('option');
    option.value = voice.voiceURI;
    option.textContent = voice.name;
    return option;
  });
  voiceSelect.replaceChildren(new Option('System default', ''), ...voiceOptions);
  voiceSelect.value = settings.voiceURI;

  const supported = engine.supported();
  $('#compat').textContent = `Recognition ${supported.recognition ? 'available' : 'unavailable'} · Microphone ${supported.media ? 'available' : 'unavailable'} · Speech ${supported.tts ? 'available' : 'unavailable'}`;
}

async function talk() {
  if (busyStates.has(state)) {
    engine.stopListening();
    engine.stopSpeaking();
    setState('idle');
    return;
  }

  $('#error').hidden = true;

  try {
    setState('listening');
    const heard = await engine.listen((level) => setState('listening', level));
    setState('thinking', 0.4);

    patchActive((conversation) => ({
      ...conversation,
      title: conversation.turns.length ? conversation.title : titleFromSpeech(heard.text),
      updatedAt: Date.now(),
      durationMs: conversation.durationMs + heard.durationMs,
      turns: [
        ...conversation.turns,
        {
          id: crypto.randomUUID(),
          role: 'user',
          text: heard.text,
          at: Date.now(),
          durationMs: heard.durationMs,
        },
      ],
    }));

    const reply = await generateVerosResponse(heard.text, active, settings);
    patchActive((conversation) => ({
      ...conversation,
      updatedAt: Date.now(),
      turns: [
        ...conversation.turns,
        { id: crypto.randomUUID(), role: 'veros', text: reply, at: Date.now() },
      ],
    }));

    setState('speaking', 0.6);
    await engine.speak(reply, settings, (level) => setState('speaking', 0.25 + level * 0.75));
    setState('idle');
  } catch (error) {
    engine.stopMic();
    $('#error span').textContent = error?.message || 'Unknown error';
    $('#error').hidden = false;
    setState('error');
  }
}

function newConversation() {
  active = createConversation(settings.model);
  conversations = [active, ...conversations];
  persist();
  setState('idle');
}

function clearMemory() {
  active = createConversation(settings.model);
  conversations = [active];
  persist();
}

function onMemoryClick(event) {
  const button = event.target.closest('button');
  if (!button) return;

  const id = button.dataset.open || button.dataset.del;
  if (!id) return;

  if (button.dataset.del) {
    conversations = conversations.filter((conversation) => conversation.id !== id);
    active = conversations[0] || createConversation(settings.model);
    if (!conversations.length) conversations = [active];
  } else {
    active = conversations.find((conversation) => conversation.id === id) || active;
  }

  persist();
}

function onSettingInput(event) {
  const id = event.target.id;
  const key = { memoryToggle: 'memory', voiceSelect: 'voiceURI' }[id] || id;
  settings = {
    ...settings,
    [key]: event.target.type === 'checkbox'
      ? event.target.checked
      : event.target.type === 'range'
        ? Number(event.target.value)
        : event.target.value,
  };
  persist();
}

$('#talk').onclick = talk;
$('#retry').onclick = talk;
$('#new').onclick = newConversation;
$('#clear').onclick = clearMemory;
$('#memories').onclick = onMemoryClick;
['rate', 'volume', 'style', 'model', 'memoryToggle', 'recording', 'voiceSelect'].forEach((id) => {
  $(`#${id}`).oninput = onSettingInput;
});
addEventListener('online', () => setState('idle'));
addEventListener('offline', () => setState('offline'));
speechSynthesis.onvoiceschanged = renderSettings;

renderSettings();
persist();
setState(state);
