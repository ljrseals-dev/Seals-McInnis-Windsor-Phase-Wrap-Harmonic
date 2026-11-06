import { fft, ifft } from "./fft";

/**
 * YIN via FFT autocorrelation. Clarity is 1 − d'(τ) at the chosen lag.
 * A pure tone should land within a couple of hertz.
 */
export function estimatePitch(
  frame: Float32Array,
  sr: number,
): { f0: number; clarity: number } {
  const w = frame.length;
  let nfft = 1;
  while (nfft < w * 2) nfft *= 2;
  const re = new Float64Array(nfft);
  const im = new Float64Array(nfft);
  for (let i = 0; i < w; i++) {
    const win = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / Math.max(1, w - 1));
    re[i] = frame[i] * win;
  }
  let energy = 0;
  for (let i = 0; i < w; i++) energy += re[i] * re[i];
  if (energy < 1e-8) return { f0: 0, clarity: 0 };

  fft(re, im);
  for (let i = 0; i < nfft; i++) {
    re[i] = re[i] * re[i] + im[i] * im[i];
    im[i] = 0;
  }
  ifft(re, im);

  const tauMin = Math.max(2, Math.floor(sr / 520));
  const tauMax = Math.min(Math.floor(sr / 65), w - 2);
  if (tauMax <= tauMin + 1) return { f0: 0, clarity: 0 };

  const r0 = re[0];
  const cmnd = new Float64Array(tauMax + 1);
  cmnd[0] = 1;
  let run = 0;
  for (let tau = 1; tau <= tauMax; tau++) {
    const d = Math.max(0, r0 + r0 - 2 * re[tau]);
    run += d;
    cmnd[tau] = (d * tau) / (run || 1e-12);
  }

  const thresh = 0.18;
  let tauEst = -1;
  for (let tau = tauMin; tau <= tauMax; tau++) {
    if (cmnd[tau] < thresh) {
      while (tau + 1 <= tauMax && cmnd[tau + 1] < cmnd[tau]) tau++;
      tauEst = tau;
      break;
    }
  }
  if (tauEst < 0) {
    let best = 1;
    for (let tau = tauMin; tau <= tauMax; tau++) {
      if (cmnd[tau] < best) {
        best = cmnd[tau];
        tauEst = tau;
      }
    }
    if (tauEst < 0 || best > 0.45) return { f0: 0, clarity: Math.max(0, 1 - best) };
  }

  const t0 = Math.max(tauMin, tauEst - 1);
  const t1 = tauEst;
  const t2 = Math.min(tauMax, tauEst + 1);
  const a = cmnd[t0];
  const b = cmnd[t1];
  const c = cmnd[t2];
  const denom = a - 2 * b + c;
  let better = t1;
  if (t0 !== t1 && t2 !== t1 && Math.abs(denom) > 1e-9) {
    better = t1 + (0.5 * (a - c)) / denom;
  }
  better = Math.max(tauMin, better);
  const clarity = Math.max(0, Math.min(1, 1 - cmnd[tauEst]));
  return { f0: sr / better, clarity };
}
