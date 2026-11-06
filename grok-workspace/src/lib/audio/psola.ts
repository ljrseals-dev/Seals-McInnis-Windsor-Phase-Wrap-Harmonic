import { rms } from "./util";

export type PsolaResult = { signal: Float32Array; fellBack: boolean };

/**
 * Time-domain PSOLA. Output duration matches the input.
 * Each output period is a Hann-windowed input period placed at the new F0,
 * which keeps the spectral envelope (the voice) while moving the pitch.
 */
export function tdPsola(
  audio: Float32Array,
  sr: number,
  frameF0: Float32Array,
  frameTarget: Float32Array,
  voiced: Uint8Array,
  hop: number,
): PsolaResult {
  const n = audio.length;
  const out = new Float32Array(n);
  const weight = new Float32Array(n);
  const marks = pitchMarks(audio, sr, frameF0, voiced, hop);

  let t = 0;
  while (t < n - 2) {
    const fi = Math.min(voiced.length - 1, Math.floor(t / hop));
    const srcF0 = frameF0[fi];
    const dstF0 = frameTarget[fi];
    const isVoiced = voiced[fi] && srcF0 > 70 && dstF0 > 70;
    if (!isVoiced || marks.length === 0) {
      const hopS = Math.max(1, Math.round(sr * 0.008));
      const end = Math.min(n, Math.round(t) + hopS);
      for (let i = Math.round(t); i < end; i++) {
        out[i] += audio[i];
        weight[i] += 1;
      }
      t = end;
      continue;
    }
    const Ta = sr / srcF0;
    const Ts = sr / dstF0;
    const mark = nearestMark(marks, t);
    if (mark < 0 || Math.abs(mark - t) > Ta * 1.8) {
      const end = Math.min(n, Math.round(t + Ts));
      for (let i = Math.round(t); i < end; i++) {
        out[i] += audio[i];
        weight[i] += 1;
      }
      t += Math.max(1, Ts);
      continue;
    }
    const half = Math.max(8, Math.min(900, Math.round(Ta)));
    const winLen = half * 2;
    const center = Math.round(t);
    for (let i = -half; i <= half; i++) {
      const ai = mark + i;
      const oi = center + i;
      if (ai < 0 || ai >= n || oi < 0 || oi >= n) continue;
      const w = 0.5 * (1 - Math.cos((2 * Math.PI * (i + half)) / winLen));
      out[oi] += audio[ai] * w;
      weight[oi] += w;
    }
    t += Math.max(1, Ts);
  }

  for (let i = 0; i < n; i++) {
    if (weight[i] > 1e-5) out[i] /= weight[i];
    else out[i] = audio[i];
  }

  const inR = rms(audio);
  const outR = rms(out);
  if (outR < inR * 0.08 || !Number.isFinite(outR)) {
    return { signal: audio.slice(), fellBack: true };
  }
  const g = inR / Math.max(1e-8, outR);
  if (g > 0.2 && g < 5) {
    for (let i = 0; i < n; i++) out[i] *= g;
  }
  return { signal: out, fellBack: false };
}

function pitchMarks(
  audio: Float32Array,
  sr: number,
  f0: Float32Array,
  voiced: Uint8Array,
  hop: number,
): Int32Array {
  const marks: number[] = [];
  const n = audio.length;
  let fi = 0;
  while (fi < voiced.length && !voiced[fi]) fi++;
  if (fi >= voiced.length) return new Int32Array();
  let pos = fi * hop;
  let guard = 0;
  while (pos < n - 8 && guard++ < n) {
    const frame = Math.min(f0.length - 1, Math.floor(pos / hop));
    if (!voiced[frame] || f0[frame] < 70) {
      pos += hop;
      continue;
    }
    const T = sr / Math.min(880, Math.max(70, f0[frame]));
    const center = Math.round(pos);
    const rad = Math.max(2, Math.round(T * 0.3));
    let best = Math.min(n - 1, Math.max(0, center));
    let bestV = -1e9;
    const a = Math.max(0, best - rad);
    const b = Math.min(n - 1, best + rad);
    for (let j = a; j <= b; j++) {
      if (audio[j] > bestV) {
        bestV = audio[j];
        best = j;
      }
    }
    if (!marks.length || best > marks[marks.length - 1]) marks.push(best);
    const next = best + T;
    pos = next > pos ? next : pos + T;
  }
  return Int32Array.from(marks);
}

function nearestMark(marks: Int32Array, t: number): number {
  if (!marks.length) return -1;
  let lo = 0;
  let hi = marks.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (marks[mid] < t) lo = mid + 1;
    else hi = mid;
  }
  const a = marks[lo];
  const b = lo > 0 ? marks[lo - 1] : a;
  return Math.abs(a - t) < Math.abs(b - t) ? a : b;
}
