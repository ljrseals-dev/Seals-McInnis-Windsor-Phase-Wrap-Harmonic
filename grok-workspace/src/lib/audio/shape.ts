import { bandpass, highpass, lowshelf, peaking, processSignal, step, type Biquad } from "./biquad";
import { chartFormants } from "./scales";
import { clamp, resampleLength } from "./util";
import type { Analysis, Articulation } from "./types";

export function voicedMask(n: number, analysis: Analysis): Float32Array {
  const m = new Float32Array(n);
  const { hop, voiced, sr } = analysis;
  for (let i = 0; i < n; i++) {
    const fi = Math.min(voiced.length - 1, Math.floor(i / hop));
    m[i] = voiced[fi] ? 1 : 0;
  }
  const coef = Math.exp(-1 / (sr * 0.008));
  let e = m[0] ?? 0;
  for (let i = 0; i < n; i++) {
    e = coef * e + (1 - coef) * m[i];
    m[i] = e;
  }
  return m;
}

export function addBreath(
  audio: Float32Array,
  sr: number,
  amount: number,
): { vocal: Float32Array; stem: Float32Array } {
  const vocal = new Float32Array(audio.length);
  const stem = new Float32Array(audio.length);
  const breath = clamp(amount, 0, 1);
  const hp = highpass(sr, 900, 0.7);
  const coef = Math.exp(-1 / (sr * 0.02));
  let env = 0;
  // Deterministic noise so a re-render is repeatable.
  let seed = 0x5eed;
  for (let i = 0; i < audio.length; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const white = (seed / 0xffffffff) * 2 - 1;
    const nse = step(hp, white);
    const a = Math.abs(audio[i]);
    env = a > env ? 0.2 * env + 0.8 * a : coef * env + (1 - coef) * a;
    stem[i] = nse * env * breath * 0.85;
    vocal[i] = audio[i] * (1 - breath * 0.28) + stem[i];
  }
  return { vocal, stem };
}

export function constrictUnvoiced(
  audio: Float32Array,
  sr: number,
  mask: Float32Array,
  constriction: number,
): Float32Array {
  const c = clamp(constriction, 0, 1);
  const freq = 1600 + c * 5200;
  const q = 0.8 + c * 2.4;
  const bp = processSignal(bandpass(sr, freq, q), audio);
  const out = new Float32Array(audio.length);
  for (let i = 0; i < audio.length; i++) {
    const m = mask[i] ?? 0;
    const wet = audio[i] * (0.35 - c * 0.15) + bp[i] * (0.55 + c * 0.7);
    out[i] = audio[i] * m + wet * (1 - m);
  }
  return out;
}

export function applyFormantsAndNasal(
  audio: Float32Array,
  sr: number,
  analysis: Analysis,
  art: Articulation,
  mask: Float32Array,
): Float32Array {
  const chart = chartFormants(art.openness, art.frontness);
  const mix = clamp(art.vowelMix, 0, 1);
  const ratio = Math.pow(2, art.formantCents / 1200);
  const measured = [analysis.f1, analysis.f2, analysis.f3];
  const chartF = [chart.f1, chart.f2, chart.f3];
  const filters: Biquad[] = [];
  for (let i = 0; i < 3; i++) {
    const target = (measured[i] * (1 - mix) + chartF[i] * mix) * ratio;
    const src = measured[i];
    if (!(src > 80 && target > 80)) continue;
    const distance = Math.abs(target - src);
    if (distance < 25 && Math.abs(art.formantCents) < 8) continue;
    const depth = clamp(distance / 80, 0, 1) * 8;
    filters.push(peaking(sr, src, 3.2, -depth));
    filters.push(peaking(sr, target, 3.2, depth));
  }
  // Presence follows the dynamics control so it stays on the panel, not hidden.
  const presence = art.dynamics * 1.6;
  if (presence > 0.2) filters.push(peaking(sr, 3200, 0.8, presence));

  let filtered = audio;
  for (const f of filters) filtered = processSignal(f, filtered);

  const nasalDb = -9 * clamp(art.velum, 0, 1);
  const lowDb = 4.5 * clamp(art.velum, 0, 1);
  if (art.velum > 0.02) {
    const notch = processSignal(peaking(sr, 1050, 1.3, nasalDb), filtered);
    const low = processSignal(lowshelf(sr, 280, lowDb), notch);
    const out = new Float32Array(audio.length);
    const v = clamp(art.velum, 0, 1);
    for (let i = 0; i < audio.length; i++) {
      const m = mask[Math.min(mask.length - 1, i)] ?? 0;
      const wet = m * v + (1 - m) * v * 0.35;
      out[i] = filtered[i] * (1 - wet) + low[i] * wet;
    }
    return out;
  }
  return filtered;
}

export function applyBursts(audio: Float32Array, bursts: { start: number; end: number }[], targetMs: number, sr: number): Float32Array {
  if (!bursts.length) return audio;
  const target = Math.max(8, Math.round((targetMs / 1000) * sr));
  let out = audio;
  for (let b = bursts.length - 1; b >= 0; b--) {
    const s = Math.round(bursts[b].start * sr);
    const e = Math.round(bursts[b].end * sr);
    if (s < 2 || e > out.length - 2 || e - s < 8) continue;
    if (e - s > sr * 0.12) continue;
    const resized = resampleLength(out.subarray(s, e), target);
    const fade = Math.min(64, Math.floor(resized.length / 3), s, out.length - e);
    for (let i = 0; i < fade; i++) {
      const w = i / fade;
      resized[i] *= w;
      resized[resized.length - 1 - i] *= w;
    }
    const next = new Float32Array(out.length - (e - s) + resized.length);
    next.set(out.subarray(0, s), 0);
    next.set(resized, s);
    next.set(out.subarray(e), s + resized.length);
    // Fill the fade dip with a blend back toward the boundary sample.
    for (let i = 0; i < fade; i++) {
      const w = i / fade;
      next[s + i] = out[s - 1] * (1 - w) + next[s + i];
      const endAt = s + resized.length - 1 - i;
      const tail = Math.min(out.length - 1, e);
      next[endAt] = next[endAt] + out[tail] * (1 - w) * 0.5;
    }
    out = next;
  }
  return out;
}

export function compress(audio: Float32Array, sr: number, amount: number): Float32Array {
  const a = clamp(amount, 0, 1);
  if (a < 0.02) return audio;
  const threshold = 0.18 + (1 - a) * 0.25;
  const ratio = 1 + a * 3.5;
  const attack = Math.exp(-1 / (sr * 0.006));
  const release = Math.exp(-1 / (sr * 0.09));
  const out = new Float32Array(audio.length);
  let env = 0;
  let gSmooth = 1;
  for (let i = 0; i < audio.length; i++) {
    const level = Math.abs(audio[i]);
    env = level > env ? attack * env + (1 - attack) * level : release * env + (1 - release) * level;
    let g = 1;
    if (env > threshold) {
      const reduced = threshold * Math.pow(env / threshold, 1 / ratio);
      g = reduced / env;
    }
    gSmooth = attack * gSmooth + (1 - attack) * g;
    out[i] = audio[i] * gSmooth;
  }
  return out;
}

export function dcBlock(audio: Float32Array, sr: number): Float32Array {
  const hp = highpass(sr, 28, 0.7);
  return processSignal(hp, audio);
}
