import { clamp } from "./util";

/**
 * Kelly–Lochbaum tube, Pink Trombone scattering.
 * Section count is chosen so a uniform tract sits near a schwa
 * (F1 ≈ sr / 4N). Areas come from tongue frontness, jaw openness,
 * and constriction. Velum opens a short nasal side branch.
 */
export function synthesizeTube(opts: {
  sr: number;
  duration: number;
  f0: number;
  openness: number;
  frontness: number;
  constriction: number;
  velum: number;
  breath: number;
}): Float32Array {
  const sr = opts.sr;
  const n = Math.max(16, Math.round(sr * 0.0005));
  const areas = areasFromVowel(n, opts.openness, opts.frontness, opts.constriction);
  const reflection = reflections(areas);
  const noseN = Math.max(10, Math.round(n * 0.55));
  const noseA = new Float64Array(noseN);
  for (let i = 0; i < noseN; i++) noseA[i] = 0.35 + 0.15 * Math.sin((i / noseN) * Math.PI);
  const noseRfl = reflections(noseA);

  const R = new Float64Array(n);
  const L = new Float64Array(n);
  const nR = new Float64Array(noseN);
  const nL = new Float64Array(noseN);
  const out = new Float32Array(Math.floor(sr * opts.duration));
  const f0 = clamp(opts.f0, 70, 880);
  const period = sr / f0;
  const openQ = 0.52;
  let phase = 0;
  let lastFlow = 0;
  let seed = 0x1234;
  const junction = Math.min(n - 2, Math.max(2, Math.round(n * 0.18)));
  const narrow = narrowest(areas);
  const lip = -0.65;
  const glot = 0.42;
  const fade = 0.992;
  const breath = clamp(opts.breath, 0, 1);
  const velum = clamp(opts.velum, 0, 1);
  const drive = 0.22;

  for (let i = 0; i < out.length; i++) {
    phase += 1;
    if (phase >= period) phase -= period;
    const open = period * openQ;
    let flow = 0;
    if (phase < open) {
      const s = Math.sin((Math.PI * phase) / open);
      flow = s * s;
    }
    let dg = (flow - lastFlow) * drive;
    lastFlow = flow;
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const noise = (seed / 0xffffffff) * 2 - 1;
    dg += noise * breath * 0.015;

    const couple = velum * 0.4;
    const nasalIn = R[junction] * couple;
    R[junction] *= 1 - couple * 0.5;
    R[narrow] += noise * opts.constriction * 0.006;

    const oral = stepTract(R, L, reflection, dg, lip, glot, fade);
    const nasal = stepTract(nR, nL, noseRfl, nasalIn, -0.6, 0.15, fade);
    let y = oral * 0.85 + nasal * (0.25 + velum * 0.4);
    if (!Number.isFinite(y)) y = 0;
    if (Math.abs(y) > 4) {
      const s = 4 / Math.abs(y);
      for (let k = 0; k < n; k++) {
        R[k] *= s;
        L[k] *= s;
      }
      y *= s;
    }
    out[i] = y;
  }
  let peak = 0;
  for (let i = 0; i < out.length; i++) peak = Math.max(peak, Math.abs(out[i]));
  if (peak > 1e-6) {
    const g = 0.45 / peak;
    for (let i = 0; i < out.length; i++) out[i] *= g;
  }
  return out;
}

export function areasFromVowel(n: number, openness: number, frontness: number, constriction: number): Float64Array {
  const areas = new Float64Array(n);
  const open = clamp(openness, 0, 1);
  const front = clamp(frontness, 0, 1);
  const cons = clamp(constriction, 0, 1);
  const loc = 0.32 + front * 0.46;
  const minA = 0.07 + (1 - cons) * 0.12 + open * 1.35;
  const maxA = 0.8 + open * 2.8 + (1 - front) * 0.4;
  const lipA = 0.12 + open * 1.7 * (0.35 + front * 0.65);
  for (let i = 0; i < n; i++) {
    const x = (i + 0.5) / n;
    const d = (x - loc) / 0.11;
    const dip = Math.exp(-d * d);
    let a = maxA * (1 - 0.72 * dip) + minA * dip;
    const lipZone = Math.max(0, (x - 0.84) / 0.16);
    a = a * (1 - lipZone) + lipA * lipZone;
    if (x < 0.08) a = Math.min(a, 0.45);
    areas[i] = Math.max(0.06, a);
  }
  return areas;
}

function reflections(A: Float64Array): Float64Array {
  const r = new Float64Array(A.length);
  for (let i = 1; i < A.length; i++) {
    r[i] = (A[i - 1] - A[i]) / (A[i - 1] + A[i] + 1e-9);
  }
  return r;
}

function narrowest(A: Float64Array): number {
  let idx = 1;
  let best = Infinity;
  for (let i = 1; i < A.length - 1; i++) {
    if (A[i] < best) {
      best = A[i];
      idx = i;
    }
  }
  return idx;
}

function stepTract(
  R: Float64Array,
  L: Float64Array,
  reflection: Float64Array,
  input: number,
  lipReflection: number,
  glottisReflection: number,
  fade: number,
): number {
  const n = R.length;
  const jR = new Float64Array(n);
  const jL = new Float64Array(n + 1);
  const lipOut = R[n - 1];
  jL[n] = lipReflection * lipOut;
  jR[0] = L[0] * glottisReflection + input;
  for (let i = 1; i < n; i++) {
    const w = reflection[i] * (R[i - 1] + L[i]);
    jR[i] = R[i - 1] - w;
    jL[i] = L[i] + w;
  }
  for (let i = 0; i < n; i++) {
    R[i] = jR[i] * fade;
    L[i] = jL[i + 1] * fade;
  }
  return lipOut;
}
