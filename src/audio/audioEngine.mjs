export class AudioEngine {
  constructor() {
    this.recognition = null;
    this.stream = null;
    this.synth = window.speechSynthesis;
  }

  supported() {
    return {
      recognition: Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
      tts: 'speechSynthesis' in window,
      media: Boolean(navigator.mediaDevices?.getUserMedia),
    };
  }

  async requestMic() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    return this.stream;
  }

  stopMic() {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }

  async listen(onLevel) {
    if (!this.supported().recognition) {
      throw new Error('Speech recognition is not supported in this browser. Try Chrome or Edge.');
    }

    await this.requestMic();
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new Recognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = navigator.language || 'en-US';

    let finalTranscript = '';
    const started = performance.now();

    return new Promise((resolve, reject) => {
      this.recognition.onresult = (event) => {
        finalTranscript = [...event.results].map((result) => result[0].transcript).join(' ');
        onLevel(Math.min(1, finalTranscript.length / 80));
      };

      this.recognition.onerror = (event) => {
        this.stopMic();
        reject(new Error(event.error || 'Speech recognition failed.'));
      };

      this.recognition.onend = () => {
        this.stopMic();
        const text = finalTranscript.trim();
        if (!text) {
          reject(new Error('I did not detect speech. Please try again.'));
          return;
        }
        resolve({ text, durationMs: performance.now() - started });
      };

      this.recognition.start();
    });
  }

  stopListening() {
    this.recognition?.stop();
    this.stopMic();
  }

  speak(text, settings, onBoundary) {
    this.stopSpeaking();
    if (!this.supported().tts) {
      return Promise.reject(new Error('Speech synthesis is unavailable.'));
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = this.synth.getVoices().find((item) => item.voiceURI === settings.voiceURI);
    if (voice) utterance.voice = voice;
    utterance.rate = settings.rate;
    utterance.volume = settings.volume;

    return new Promise((resolve, reject) => {
      utterance.onboundary = (event) => onBoundary?.(event.charIndex / text.length);
      utterance.onend = resolve;
      utterance.onerror = () => reject(new Error('Speech playback failed.'));
      this.synth.speak(utterance);
    });
  }

  stopSpeaking() {
    if (this.synth?.speaking) this.synth.cancel();
  }
}
