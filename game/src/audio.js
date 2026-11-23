// Emberfall sounds: tiny WebAudio synth, no audio files, no network.
// Everything is created on the first user gesture; shot mode stays silent.
let ctx = null;
let muted = false;

export function setMuted(m) { muted = m; }
export function isMuted() { return muted; }

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'sine', gain = 0.12, when = 0) {
  if (muted) return;
  const ac = ensure();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  select() { tone(660, 0.07, 'triangle', 0.08); },
  play() { tone(392, 0.12, 'triangle', 0.12); tone(587, 0.16, 'triangle', 0.1, 0.06); },
  draw() { tone(880, 0.06, 'sine', 0.06); },
  hit() { tone(180, 0.14, 'sawtooth', 0.12); tone(120, 0.18, 'square', 0.07, 0.02); },
  heal() { tone(523, 0.18, 'sine', 0.09); tone(784, 0.22, 'sine', 0.08, 0.08); },
  error() { tone(140, 0.16, 'square', 0.08); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, 'triangle', 0.12, i * 0.12)); },
  loss() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.32, 'triangle', 0.1, i * 0.14)); },
};
