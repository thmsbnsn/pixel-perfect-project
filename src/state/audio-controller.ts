// Single-play audio coordinator. Only one clip may play at a time.
// Uses WebAudio to render short synthetic tones per asset id so the mock
// shell has real audible playback without shipping binary files.

type Listener = (state: PlaybackState) => void;

export interface PlaybackState {
  playingId: string | null;
  positionSec: number;
  durationSec: number;
}

const listeners = new Set<Listener>();
let state: PlaybackState = { playingId: null, positionSec: 0, durationSec: 0 };
let ctx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let currentGain: GainNode | null = null;
let startedAt = 0;
let raf: number | null = null;

function publish() {
  const snap = { ...state };
  listeners.forEach((l) => l(snap));
}

function ensureCtx(): AudioContext {
  if (!ctx) {
    const AC =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) throw new Error("WebAudio unavailable");
    ctx = new AC();
  }
  return ctx;
}

function buildBuffer(seed: number, durationSec: number): AudioBuffer {
  const c = ensureCtx();
  const sr = 22050;
  const len = Math.max(1, Math.floor(sr * durationSec));
  const buf = c.createBuffer(1, len, sr);
  const data = buf.getChannelData(0);
  const base = 90 + (seed % 60);
  const detune = 1 + ((seed >> 3) % 5) * 0.01;
  for (let i = 0; i < len; i++) {
    const t = i / sr;
    const env =
      Math.min(1, t / 0.05) * Math.min(1, (durationSec - t) / 0.2) *
      (0.5 + 0.5 * Math.sin(t * 0.5));
    const v =
      Math.sin(2 * Math.PI * base * t) * 0.35 +
      Math.sin(2 * Math.PI * base * detune * 2 * t) * 0.15 +
      (Math.random() - 0.5) * 0.05;
    data[i] = v * env * 0.6;
  }
  return buf;
}

function tick() {
  if (!currentSource || !ctx) return;
  const pos = ctx.currentTime - startedAt;
  state = { ...state, positionSec: Math.max(0, pos) };
  publish();
  if (pos >= state.durationSec) {
    stop();
    return;
  }
  raf = requestAnimationFrame(tick);
}

export function play(id: string, opts: { seed?: number; durationSec?: number }) {
  const c = ensureCtx();
  stop();
  const dur = Math.max(1, Math.min(60, opts.durationSec ?? 8));
  const buf = buildBuffer(opts.seed ?? id.length * 13, dur);
  const src = c.createBufferSource();
  const gain = c.createGain();
  gain.gain.value = 0.6;
  src.buffer = buf;
  src.connect(gain).connect(c.destination);
  src.start();
  currentSource = src;
  currentGain = gain;
  startedAt = c.currentTime;
  state = { playingId: id, positionSec: 0, durationSec: dur };
  publish();
  raf = requestAnimationFrame(tick);
}

export function stop() {
  if (raf != null) cancelAnimationFrame(raf);
  raf = null;
  try {
    currentSource?.stop();
  } catch {
    /* noop */
  }
  currentSource?.disconnect();
  currentGain?.disconnect();
  currentSource = null;
  currentGain = null;
  if (state.playingId !== null) {
    state = { playingId: null, positionSec: 0, durationSec: 0 };
    publish();
  }
}

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  l(state);
  return () => {
    listeners.delete(l);
  };
}

export function getState() {
  return { ...state };
}
