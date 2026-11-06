import { highpass, highshelf, processChain } from "./biquad";
import { db } from "./util";

const TARGET_LUFS = -14;

export type Loudness = {
  integrated: number;
  samplePeakDb: number;
  truePeakDb: number;
};

/**
 * Integrated loudness using a BS.1770-shaped K-weight (high shelf + high-pass)
 * and the absolute/relative gates. This is an approximation, not a certified meter.
 * True peak is a 4× Catmull-Rom inter-sample estimate.
 */
export function measureLoudness(x: Float32Array, sr: number): Loudness {
  const weighted = processChain(
    [highshelf(sr, 1682, 4), highpass(sr, 38, 0.5)],
    x,
  );
  const integrated = integratedLufs(weighted, sr);
  let samplePeak = 0;
  for (let i = 0; i < x.length; i++) samplePeak = Math.max(samplePeak, Math.abs(x[i]));
  return {
    integrated,
    samplePeakDb: db(samplePeak),
    truePeakDb: truePeakDb(x),
  };
}

export function normalizeDelivery(x: Float32Array, sr: number): { audio: Float32Array; measured: Loudness } {
  const first = measureLoudness(x, sr);
  let gainDb = Number.isFinite(first.integrated) ? TARGET_LUFS - first.integrated : -12;
  gainDb = Math.max(-48, Math.min(30, gainDb));
  let y = applyGain(x, Math.pow(10, gainDb / 20));
  // Limit sample peaks so a short burst cannot drag the whole vocal down.
  // Leave a little room under full scale; true peak is checked after.
  const sampleCeiling = Math.pow(10, -1.4 / 20);
  for (let i = 0; i < y.length; i++) {
    if (y[i] > sampleCeiling) y[i] = sampleCeiling;
    else if (y[i] < -sampleCeiling) y[i] = -sampleCeiling;
  }
  let measured = measureLoudness(y, sr);
  if (measured.truePeakDb > -1) {
    y = applyGain(y, Math.pow(10, (-1.05 - measured.truePeakDb) / 20));
    measured = measureLoudness(y, sr);
  }
  return { audio: y, measured };
}

function applyGain(x: Float32Array, g: number): Float32Array {
  const y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) y[i] = x[i] * g;
  return y;
}

function integratedLufs(x: Float32Array, sr: number): number {
  if (x.length < 8) return -Infinity;
  const block = Math.round(0.4 * sr);
  if (x.length < block) return lufsOf(meanSquare(x, 0, x.length));
  const hop = Math.max(1, Math.round(0.1 * sr));
  const blocks: number[] = [];
  for (let i = 0; i + block <= x.length; i += hop) blocks.push(meanSquare(x, i, i + block));
  const abs = blocks.filter((p) => lufsOf(p) > -70);
  if (!abs.length) return -Infinity;
  const ungated = lufsOf(average(abs));
  const rel = abs.filter((p) => lufsOf(p) > ungated - 10);
  const used = rel.length ? rel : abs;
  return lufsOf(average(used));
}

function meanSquare(x: Float32Array, a: number, b: number): number {
  let s = 0;
  for (let i = a; i < b; i++) s += x[i] * x[i];
  return s / Math.max(1, b - a);
}

function average(xs: number[]): number {
  let s = 0;
  for (const v of xs) s += v;
  return s / xs.length;
}

function lufsOf(meanSquarePower: number): number {
  return -0.691 + 10 * Math.log10(Math.max(meanSquarePower, 1e-12));
}

function truePeakDb(x: Float32Array): number {
  let peak = 0;
  const n = x.length;
  for (let i = 0; i < n; i++) {
    peak = Math.max(peak, Math.abs(x[i]));
    if (i >= n - 1) continue;
    const p0 = x[Math.max(0, i - 1)];
    const p1 = x[i];
    const p2 = x[i + 1];
    const p3 = x[Math.min(n - 1, i + 2)];
    for (let k = 1; k <= 3; k++) {
      const t = k / 4;
      peak = Math.max(peak, Math.abs(catmull(p0, p1, p2, p3, t)));
    }
  }
  return db(peak);
}

function catmull(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}
