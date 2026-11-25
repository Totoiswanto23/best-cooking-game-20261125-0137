// All sound is synthesized with WebAudio: no audio files, no network, just bleeps,
// sizzles and one triumphant little ding. Sound starts only after the player
// first interacts (browsers demand a gesture), and the M key mutes it.
let audioContext = null;
let muted = false;

function context() {
  if (typeof window === 'undefined') return null;
  if (audioContext === null) {
    const AudioContext = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContext) return null;
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') void audioContext.resume();
  return audioContext;
}

// A short tone: frequency slides from `from` to `to` over `seconds`.
function tone(from, to, seconds, type, volume) {
  if (muted) return;
  const ctx = context();
  if (ctx === null) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), ctx.currentTime + seconds);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + seconds);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + seconds);
}

// Filtered noise, for the sizzle of the grill and the chop-chop of the board.
function noise(seconds, frequency, volume) {
  if (muted) return;
  const ctx = context();
  if (ctx === null) return;
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = frequency;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start();
}

export const sfx = {
  unlock() {
    // Called on the first pointer or key gesture, so later sounds are allowed.
    context();
  },
  toggleMute() {
    muted = !muted;
    return muted;
  },
  isMuted() {
    return muted;
  },
  pick() {
    tone(520, 660, 0.07, 'sine', 0.12);
  },
  chop() {
    noise(0.08, 2400, 0.25);
  },
  sizzle() {
    noise(0.5, 5200, 0.1);
  },
  ding() {
    tone(880, 880, 0.12, 'triangle', 0.15);
    setTimeout(() => tone(1318, 1318, 0.2, 'triangle', 0.15), 110);
  },
  serve() {
    tone(523, 523, 0.1, 'triangle', 0.18);
    setTimeout(() => tone(659, 659, 0.1, 'triangle', 0.18), 90);
    setTimeout(() => tone(784, 784, 0.22, 'triangle', 0.18), 180);
  },
  wrong() {
    tone(220, 140, 0.18, 'square', 0.08);
  },
  burn() {
    tone(300, 90, 0.4, 'sawtooth', 0.08);
  },
  lost() {
    tone(392, 392, 0.15, 'sine', 0.12);
    setTimeout(() => tone(311, 311, 0.3, 'sine', 0.12), 150);
  },
};
