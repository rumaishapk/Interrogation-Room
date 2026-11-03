"use client";
// A short mechanical "click", made in the browser with the Web Audio API,
// so there is no audio file to license or download.
// It is two layers: a low thump (a brass switch) and a quick bright snap
// (a typewriter key).

const CLICK_VOLUME = 0.22; // 0 to 1: a quiet tick, never louder than the music
const MIN_GAP_SECONDS = 0.04; // ignore double-fires so fast clicking doesn't buzz

let context: AudioContext | null = null;
let noise: AudioBuffer | null = null;
let lastClickAt = -Infinity;

// Created on first use. That is always inside a click, which browsers treat as
// permission to make sound.
function getContext(): AudioContext | null {
  if (typeof window === "undefined" || typeof AudioContext === "undefined") return null;
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume();
  return context;
}

// 30 ms of random noise, made once and reused.
function getNoise(ctx: AudioContext): AudioBuffer {
  if (!noise) {
    noise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.03), ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noise;
}

export function playClick() {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  if (now - lastClickAt < MIN_GAP_SECONDS) return;
  lastClickAt = now;

  // Layer 1: the thump. A sine that drops in pitch and dies away in about 70 ms.
  const thump = ctx.createOscillator();
  const thumpGain = ctx.createGain();
  thump.type = "sine";
  thump.frequency.setValueAtTime(190, now);
  thump.frequency.exponentialRampToValueAtTime(60, now + 0.06);
  thumpGain.gain.setValueAtTime(CLICK_VOLUME, now);
  thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
  thump.connect(thumpGain).connect(ctx.destination);
  thump.start(now);
  thump.stop(now + 0.08);

  // Layer 2: the snap. A burst of noise with the low end filtered out.
  const snap = ctx.createBufferSource();
  const snapFilter = ctx.createBiquadFilter();
  const snapGain = ctx.createGain();
  snap.buffer = getNoise(ctx);
  snapFilter.type = "highpass";
  snapFilter.frequency.value = 2500;
  snapGain.gain.setValueAtTime(CLICK_VOLUME * 0.6, now);
  snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
  snap.connect(snapFilter).connect(snapGain).connect(ctx.destination);
  snap.start(now);
}

// Things that should click when pressed.
const CLICKABLE = "button, a[href], summary, [role='button'], input[type='submit'], input[type='button']";

// Is this click on something that is really pressable? Disabled buttons stay silent.
export function isClickTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const element = target.closest(CLICKABLE);
  if (!element) return false;
  if (element.closest("[disabled], [aria-disabled='true']")) return false;
  return true;
}
