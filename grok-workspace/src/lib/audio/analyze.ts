import { estimatePitch } from "./yin";
import { decimate2, median, removeDc } from "./util";
import type { Analysis, Burst, Segment } from "./types";

const VOICED_CLARITY = 0.72;

export function analyze(input: Float32Array, sr: number): Analysis {
  const audio = removeDc(input);
  const hop = Math.max(128, Math.round(sr * 0.012));
  const nFrames = Math.max(1, Math.floor((audio.length - 64) / hop));
  const tracked = trackPitch(audio, sr, hop, nFrames);
  smoothPitch(tracked.f0, tracked.clarity, tracked.voiced);

  const rmsArr = new Float32Array(nFrames);
  const zcrArr = new Float32Array(nFrames);
  const win = Math.max(hop * 2, 256);
  for (let i = 0; i < nFrames; i++) {
    const center = i * hop + (hop >> 1);
    const a = Math.max(0, center - (win >> 1));
    const b = Math.min(audio.length, a + win);
    let s = 0;
    let z = 0;
    let prev = audio[a] ?? 0;
    for (let j = a; j < b; j++) {
      const v = audio[j];
      s += v * v;
      if (v >= 0 !== prev >= 0) z++;
      prev = v;
    }
    const len = Math.max(1, b - a);
    rmsArr[i] = Math.sqrt(s / len);
    zcrArr[i] = z / len;
  }

  const formants = estimateFormants(audio, sr, tracked.voiced, hop);
  const bursts = findBursts(rmsArr, hop, sr);
  const segments = buildSegments(tracked.voiced, rmsArr, zcrArr, bursts, hop, sr, audio.length);

  let voicedCount = 0;
  let breathAcc = 0;
  let zAcc = 0;
  const f0s: number[] = [];
  for (let i = 0; i < nFrames; i++) {
    if (tracked.voiced[i]) {
      voicedCount++;
      breathAcc += 1 - tracked.clarity[i];
      f0s.push(tracked.f0[i]);
      zAcc += zcrArr[i];
    }
  }

  return {
    sr,
    hop,
    f0: tracked.f0,
    voiced: tracked.voiced,
    clarity: tracked.clarity,
    rms: rmsArr,
    zcr: zcrArr,
    medianF0: median(f0s),
    f1: formants.f1,
    f2: formants.f2,
    f3: formants.f3,
    breath: voicedCount ? clamp01(breathAcc / voicedCount) : 0.2,
    voicedRatio: voicedCount / nFrames,
    brightness: voicedCount ? zAcc / voicedCount : 0,
    bursts,
    segments,
    duration: audio.length / sr,
  };
}

/** Pitch-only pass used to score a render without another formant estimate. */
export function pitchTrack(audio: Float32Array, sr: number): {
  f0: Float32Array;
  voiced: Uint8Array;
  clarity: Float32Array;
  hop: number;
} {
  const hop = Math.max(128, Math.round(sr * 0.012));
  const nFrames = Math.max(1, Math.floor((audio.length - 64) / hop));
  const tracked = trackPitch(audio, sr, hop, nFrames);
  smoothPitch(tracked.f0, tracked.clarity, tracked.voiced);
  return { ...tracked, hop };
}

function trackPitch(audio: Float32Array, sr: number, hopIn: number, nFrames: number) {
  let x = audio;
  let psr = sr;
  let dec = 1;
  while (psr > 12500 && x.length > 2048) {
    x = decimate2(x);
    psr /= 2;
    dec *= 2;
  }
  const frameLen = 1024;
  const f0 = new Float32Array(nFrames);
  const clarity = new Float32Array(nFrames);
  const voiced = new Uint8Array(nFrames);
  const buf = new Float32Array(frameLen);
  for (let i = 0; i < nFrames; i++) {
    const center = Math.round((i * hopIn + hopIn / 2) / dec);
    const start = center - (frameLen >> 1);
    for (let j = 0; j < frameLen; j++) {
      const k = start + j;
      buf[j] = k >= 0 && k < x.length ? x[k] : 0;
    }
    const est = estimatePitch(buf, psr);
    f0[i] = est.f0;
    clarity[i] = est.clarity;
    voiced[i] = est.f0 > 70 && est.f0 < 880 && est.clarity >= VOICED_CLARITY ? 1 : 0;
    if (!voiced[i]) f0[i] = 0;
  }
  return { f0, clarity, voiced };
}

function smoothPitch(f0: Float32Array, clarity: Float32Array, voiced: Uint8Array) {
  for (let i = 1; i < f0.length; i++) {
    if (!voiced[i] || !voiced[i - 1]) continue;
    const ratio = f0[i] / f0[i - 1];
    if (ratio > 1.85 && f0[i] / 2 > 70) f0[i] /= 2;
    else if (ratio < 0.54 && f0[i] * 2 < 880) f0[i] *= 2;
  }
  const copy = f0.slice();
  for (let i = 1; i < f0.length - 1; i++) {
    if (!voiced[i]) continue;
    const window: number[] = [];
    for (let k = i - 1; k <= i + 1; k++) if (voiced[k] && copy[k] > 0) window.push(copy[k]);
    if (window.length >= 2) f0[i] = median(window);
  }
  for (let i = 1; i < f0.length; i++) {
    if (voiced[i] && clarity[i] < VOICED_CLARITY) {
      voiced[i] = 0;
      f0[i] = 0;
    }
  }
}

function estimateFormants(
  audio: Float32Array,
  sr: number,
  voiced: Uint8Array,
  hop: number,
): { f1: number; f2: number; f3: number } {
  const picks: { f1: number; f2: number; f3: number }[] = [];
  const step = Math.max(1, Math.floor(voiced.length / 36));
  for (let i = 0; i < voiced.length && picks.length < 24; i += step) {
    if (!voiced[i]) continue;
    const center = i * hop + (hop >> 1);
    const found = formantsAt(audio, center, sr);
    if (found) picks.push(found);
  }
  if (!picks.length) return { f1: 500, f2: 1500, f3: 2500 };
  return {
    f1: median(picks.map((p) => p.f1)),
    f2: median(picks.map((p) => p.f2)),
    f3: median(picks.map((p) => p.f3)),
  };
}

function formantsAt(
  audio: Float32Array,
  center: number,
  sr: number,
): { f1: number; f2: number; f3: number } | null {
  const N = 768;
  const frame = new Float32Array(N);
  const start = center - (N >> 1);
  let prev = 0;
  for (let i = 0; i < N; i++) {
    const k = start + i;
    const raw = k >= 0 && k < audio.length ? audio[k] : 0;
    const emph = raw - 0.95 * prev;
    prev = raw;
    const w = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (N - 1));
    frame[i] = emph * w;
  }
  const order = sr > 20000 ? 18 : 14;
  const a = levinson(frame, order);
  const bins = 512;
  const env = new Float64Array(bins);
  for (let bin = 1; bin < bins; bin++) {
    const w = (Math.PI * bin) / bins;
    let re = 1;
    let im = 0;
    for (let k = 1; k <= order; k++) {
      re -= a[k] * Math.cos(w * k);
      im += a[k] * Math.sin(w * k);
    }
    env[bin] = 1 / Math.max(1e-8, Math.hypot(re, im));
  }
  const hzPerBin = sr / 2 / bins;
  const f1 = peakIn(env, hzPerBin, 200, 980, 2);
  if (!f1) return null;
  const f2 = peakIn(env, hzPerBin, Math.max(850, f1 + 250), 2400, 2);
  if (!f2) return null;
  const f3 = peakIn(env, hzPerBin, Math.max(1600, f2 + 300), 3800, 2);
  if (!f3) return null;
  return { f1, f2, f3 };
}

function levinson(x: Float32Array, order: number): Float64Array {
  const r = new Float64Array(order + 1);
  for (let lag = 0; lag <= order; lag++) {
    let s = 0;
    for (let i = 0; i < x.length - lag; i++) s += x[i] * x[i + lag];
    r[lag] = s;
  }
  const a = new Float64Array(order + 1);
  a[0] = 1;
  if (r[0] <= 1e-9) return a;
  let err = r[0];
  for (let i = 1; i <= order; i++) {
    let acc = r[i];
    for (let j = 1; j < i; j++) acc -= a[j] * r[i - j];
    const k = acc / err;
    const prev = a.slice(0, i);
    for (let j = 1; j < i; j++) a[j] = prev[j] - k * prev[i - j];
    a[i] = k;
    err *= 1 - k * k;
    if (!Number.isFinite(err) || err <= 1e-12) break;
  }
  return a;
}

function peakIn(env: Float64Array, hzPerBin: number, minHz: number, maxHz: number, minK: number): number | null {
  const k0 = Math.max(minK, Math.floor(minHz / hzPerBin));
  const k1 = Math.min(env.length - 2, Math.ceil(maxHz / hzPerBin));
  let bestK = -1;
  let best = -Infinity;
  for (let k = k0; k <= k1; k++) {
    if (env[k] >= env[k - 1] && env[k] >= env[k + 1] && env[k] > best) {
      best = env[k];
      bestK = k;
    }
  }
  if (bestK < 0) return null;
  const a = Math.log(env[bestK - 1] + 1e-12);
  const b = Math.log(env[bestK] + 1e-12);
  const c = Math.log(env[bestK + 1] + 1e-12);
  const denom = a - 2 * b + c;
  const delta = Math.abs(denom) < 1e-9 ? 0 : (0.5 * (a - c)) / denom;
  return (bestK + delta) * hzPerBin;
}

function findBursts(rmsArr: Float32Array, hop: number, sr: number): Burst[] {
  const bursts: Burst[] = [];
  const pre = Math.max(1, Math.round(0.03 / (hop / sr)));
  for (let i = pre; i < rmsArr.length - 2; i++) {
    const prev = rmsArr[i - pre];
    const cur = rmsArr[i];
    if (prev < 0.045 && cur > Math.max(0.05, prev * 2.6)) {
      let end = i;
      const limit = Math.min(rmsArr.length - 1, i + Math.round(0.09 / (hop / sr)));
      while (end < limit && rmsArr[end] > cur * 0.35) end++;
      const startSec = (i * hop) / sr;
      const endSec = Math.max(startSec + 0.012, (end * hop) / sr);
      if (bursts.length && startSec - bursts[bursts.length - 1].end < 0.08) continue;
      bursts.push({ start: startSec, end: endSec });
      if (bursts.length >= 8) break;
      i = end;
    }
  }
  return bursts;
}

function buildSegments(
  voiced: Uint8Array,
  rmsArr: Float32Array,
  zcrArr: Float32Array,
  bursts: Burst[],
  hop: number,
  sr: number,
  _length: number,
): Segment[] {
  const kinds: Segment["kind"][] = new Array(voiced.length);
  for (let i = 0; i < voiced.length; i++) {
    const t = (i * hop) / sr;
    if (bursts.some((b) => t >= b.start && t < b.end)) kinds[i] = "burst";
    else if (rmsArr[i] < 0.02) kinds[i] = "silence";
    else if (voiced[i]) kinds[i] = "vowel";
    else if (zcrArr[i] > 0.08) kinds[i] = "fricative";
    else kinds[i] = "silence";
  }
  const segments: Segment[] = [];
  let i = 0;
  while (i < kinds.length) {
    const kind = kinds[i];
    let j = i + 1;
    while (j < kinds.length && kinds[j] === kind) j++;
    segments.push({ start: (i * hop) / sr, end: (j * hop) / sr, kind });
    i = j;
  }
  return segments;
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}
