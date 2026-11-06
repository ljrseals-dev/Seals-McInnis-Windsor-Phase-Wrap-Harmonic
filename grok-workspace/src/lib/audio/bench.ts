import { peakAbs } from "./util";

/**
 * A deliberately unsteady synthetic take: C–E–G–E in a cascade of
 * formant resonators, with pitch wander, a stop gap, and a noise burst.
 * Enough for the studio to demonstrate pitch lock without a microphone.
 */
export function makeBenchTake(sr = 44100): Float32Array {
  const seconds = 4.2;
  const n = Math.floor(sr * seconds);
  const y = new Float32Array(n);
  const midis = [60, 64, 67, 64];
  const filters = [resonator(sr, 680, 90), resonator(sr, 1220, 110), resonator(sr, 2550, 160)];
  let phase = 0;
  let lastFlow = 0;
  const offsets = [0.034, -0.031, 0.028, -0.036, 0.033, -0.027, 0.03, -0.034];
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const seg = Math.min(midis.length - 1, Math.floor(t));
    const base = 440 * Math.pow(2, (midis[seg] - 69) / 12);
    const offset = offsets[Math.floor(t / 0.21) % offsets.length];
    const f0 = base * Math.pow(2, offset);
    const period = sr / f0;
    phase += 1;
    if (phase >= period) phase -= period;
    const open = period * 0.56;
    let flow = 0;
    if (phase < open) {
      const s = Math.sin((Math.PI * phase) / open);
      flow = s * s;
    }
    let g = (flow - lastFlow) * 2.4;
    lastFlow = flow;
    g += (hash(i + 17) - 0.5) * 0.04;
    const local = (t % 1) / 0.9;
    const env = local < 1 ? Math.sin(Math.PI * Math.min(1, local)) ** 1.1 : 0.15;
    let s = g * (0.4 + 0.6 * env);
    for (const f of filters) s = f.step(s);
    y[i] = s;
  }
  imprintBurst(y, sr);
  const p = peakAbs(y);
  if (p > 1e-6) {
    const g = 0.48 / p;
    for (let i = 0; i < n; i++) y[i] *= g;
  }
  return y;
}

function imprintBurst(y: Float32Array, sr: number) {
  const gapA = Math.floor(1.48 * sr);
  const gapB = Math.floor(1.6 * sr);
  const burstB = Math.floor(1.69 * sr);
  for (let i = gapA; i < gapB && i < y.length; i++) {
    const w = (i - gapA) / Math.max(1, gapB - gapA);
    y[i] *= 1 - w;
  }
  for (let i = gapB; i < burstB && i < y.length; i++) {
    const u = (i - gapB) / Math.max(1, burstB - gapB);
    const env = Math.sin(Math.PI * u) ** 0.7;
    y[i] = (hash(i + 41) - 0.5) * 1.6 * env;
  }
}
function resonator(sr: number, freq: number, bw: number) {
  const r = Math.exp((-Math.PI * bw) / sr);
  const theta = (2 * Math.PI * freq) / sr;
  const a1 = 2 * r * Math.cos(theta);
  const a2 = -(r * r);
  const gain = (1 - r) * 0.55;
  let y1 = 0;
  let y2 = 0;
  return {
    step(x: number) {
      const y = gain * x + a1 * y1 + a2 * y2;
      y2 = y1;
      y1 = y;
      return y;
    },
  };
}

function hash(i: number): number {
  let x = (i * 1664525 + 1013904223) >>> 0;
  x ^= x >>> 16;
  return (x & 0xffff) / 0xffff;
}
