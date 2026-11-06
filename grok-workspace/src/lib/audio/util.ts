export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function rms(x: Float32Array, start = 0, end = x.length): number {
  let s = 0;
  const n = Math.max(1, end - start);
  for (let i = start; i < end; i++) s += x[i] * x[i];
  return Math.sqrt(s / n);
}

export function peakAbs(x: Float32Array): number {
  let p = 0;
  for (let i = 0; i < x.length; i++) {
    const a = Math.abs(x[i]);
    if (a > p) p = a;
  }
  return p;
}

export function removeDc(x: Float32Array): Float32Array {
  let m = 0;
  for (let i = 0; i < x.length; i++) m += x[i];
  m /= Math.max(1, x.length);
  const y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) y[i] = x[i] - m;
  return y;
}

/** Gentle level condition so a quiet mic still analyzes, without flattening dynamics. */
export function conditionLevel(x: Float32Array): Float32Array {
  const p = peakAbs(x);
  if (p < 1e-6) return x;
  const target = p < 0.18 ? 0.42 : p > 0.98 ? 0.9 : 0;
  if (target === 0) return x;
  const g = target / p;
  const y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) y[i] = x[i] * g;
  return y;
}

export function decimate2(x: Float32Array): Float32Array {
  const n = Math.floor(x.length / 2);
  const y = new Float32Array(n);
  for (let i = 0; i < n; i++) y[i] = 0.5 * (x[i * 2] + x[i * 2 + 1]);
  return y;
}

export function resampleLength(input: Float32Array, outLen: number): Float32Array {
  const out = new Float32Array(Math.max(1, outLen));
  if (input.length === 0) return out;
  const scale = input.length / out.length;
  for (let i = 0; i < out.length; i++) {
    const x = i * scale;
    const i0 = Math.min(input.length - 1, Math.floor(x));
    const i1 = Math.min(input.length - 1, i0 + 1);
    const f = x - i0;
    out[i] = input[i0] + (input[i1] - input[i0]) * f;
  }
  return out;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = values.slice().sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

export function db(linear: number): number {
  return 20 * Math.log10(Math.max(linear, 1e-12));
}
