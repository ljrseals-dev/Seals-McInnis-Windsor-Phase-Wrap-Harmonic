export type Biquad = {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
  z1: number;
  z2: number;
};

function normalize(
  b0: number,
  b1: number,
  b2: number,
  a0: number,
  a1: number,
  a2: number,
): Biquad {
  return {
    b0: b0 / a0,
    b1: b1 / a0,
    b2: b2 / a0,
    a1: a1 / a0,
    a2: a2 / a0,
    z1: 0,
    z2: 0,
  };
}

export function peaking(sr: number, freq: number, q: number, gainDb: number): Biquad {
  const A = Math.pow(10, gainDb / 40);
  const w0 = (2 * Math.PI * clampFreq(freq, sr)) / sr;
  const alpha = Math.sin(w0) / (2 * Math.max(0.05, q));
  const cos = Math.cos(w0);
  return normalize(
    1 + alpha * A,
    -2 * cos,
    1 - alpha * A,
    1 + alpha / A,
    -2 * cos,
    1 - alpha / A,
  );
}

export function highpass(sr: number, freq: number, q: number): Biquad {
  const w0 = (2 * Math.PI * clampFreq(freq, sr)) / sr;
  const alpha = Math.sin(w0) / (2 * Math.max(0.05, q));
  const cos = Math.cos(w0);
  return normalize((1 + cos) / 2, -(1 + cos), (1 + cos) / 2, 1 + alpha, -2 * cos, 1 - alpha);
}

export function lowshelf(sr: number, freq: number, gainDb: number): Biquad {
  return shelf(sr, freq, gainDb, false);
}

export function highshelf(sr: number, freq: number, gainDb: number): Biquad {
  return shelf(sr, freq, gainDb, true);
}

function shelf(sr: number, freq: number, gainDb: number, high: boolean): Biquad {
  const A = Math.pow(10, gainDb / 40);
  const w0 = (2 * Math.PI * clampFreq(freq, sr)) / sr;
  const cos = Math.cos(w0);
  const sin = Math.sin(w0);
  const S = 1;
  const alpha = (sin / 2) * Math.sqrt((A + 1 / A) * (1 / S - 1) + 2);
  const twoSqrtAAlpha = 2 * Math.sqrt(A) * alpha;
  if (high) {
    return normalize(
      A * (A + 1 + (A - 1) * cos + twoSqrtAAlpha),
      -2 * A * (A - 1 + (A + 1) * cos),
      A * (A + 1 + (A - 1) * cos - twoSqrtAAlpha),
      A + 1 - (A - 1) * cos + twoSqrtAAlpha,
      2 * (A - 1 - (A + 1) * cos),
      A + 1 - (A - 1) * cos - twoSqrtAAlpha,
    );
  }
  return normalize(
    A * (A + 1 - (A - 1) * cos + twoSqrtAAlpha),
    2 * A * (A - 1 - (A + 1) * cos),
    A * (A + 1 - (A - 1) * cos - twoSqrtAAlpha),
    A + 1 + (A - 1) * cos + twoSqrtAAlpha,
    -2 * (A - 1 + (A + 1) * cos),
    A + 1 + (A - 1) * cos - twoSqrtAAlpha,
  );
}

export function bandpass(sr: number, freq: number, q: number): Biquad {
  const w0 = (2 * Math.PI * clampFreq(freq, sr)) / sr;
  const alpha = Math.sin(w0) / (2 * Math.max(0.05, q));
  const cos = Math.cos(w0);
  return normalize(alpha, 0, -alpha, 1 + alpha, -2 * cos, 1 - alpha);
}

function clampFreq(freq: number, sr: number): number {
  return Math.min(sr * 0.45, Math.max(20, freq));
}

export function cloneBiquad(s: Biquad): Biquad {
  return { ...s, z1: 0, z2: 0 };
}

export function processSignal(filter: Biquad, x: Float32Array): Float32Array {
  const y = new Float32Array(x.length);
  const s = cloneBiquad(filter);
  for (let i = 0; i < x.length; i++) y[i] = step(s, x[i]);
  return y;
}

export function step(s: Biquad, x: number): number {
  const y = s.b0 * x + s.z1;
  s.z1 = s.b1 * x - s.a1 * y + s.z2;
  s.z2 = s.b2 * x - s.a2 * y;
  return y;
}

export function processChain(filters: Biquad[], x: Float32Array): Float32Array {
  let y = x;
  for (const f of filters) y = processSignal(f, y);
  return y;
}
