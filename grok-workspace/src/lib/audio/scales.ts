import { clamp } from "./util";
import type { Analysis, Articulation, ScaleName } from "./types";

export const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

export const SCALE_DEGREES: Record<ScaleName, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

export const PHRASES: { id: string; name: string; degrees?: number[] }[] = [
  { id: "snap", name: "Snap contour" },
  { id: "doremi", name: "Do Re Mi", degrees: [0, 2, 4, 2] },
  { id: "fifth", name: "Rising fifth", degrees: [0, 7] },
  { id: "turn", name: "Turnaround", degrees: [0, 2, 4, 5, 4, 2, 0] },
  { id: "sigh", name: "Minor sigh", degrees: [7, 5, 3, 2, 0] },
];

const NOTE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function hzToMidi(f0: number): number {
  return 69 + 12 * Math.log2(f0 / 440);
}

export function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function noteName(f0: number): string {
  if (!Number.isFinite(f0) || f0 < 40) return "—";
  const midi = Math.round(hzToMidi(f0));
  const name = NOTE[((midi % 12) + 12) % 12];
  const oct = Math.floor(midi / 12) - 1;
  return `${name}${oct}`;
}

export function snapHz(f0: number, tonicPc: number, degrees: number[]): number {
  const midi = hzToMidi(f0);
  let best = Math.round(midi);
  let bestDist = 99;
  const lo = Math.floor(midi) - 7;
  const hi = Math.ceil(midi) + 7;
  for (let m = lo; m <= hi; m++) {
    const pc = ((m % 12) + 12) % 12;
    const rel = (pc - tonicPc + 12) % 12;
    if (!degrees.includes(rel)) continue;
    const dist = Math.abs(m - midi);
    if (dist < bestDist) {
      bestDist = dist;
      best = m;
    }
  }
  return midiToHz(best);
}

export function chartFormants(openness: number, frontness: number): { f1: number; f2: number; f3: number } {
  const open = clamp(openness, 0, 1);
  const front = clamp(frontness, 0, 1);
  const f1 = 270 + open * 680;
  const f2 = 760 + front * 1580 - open * 160;
  const f3 = 2350 + front * 620 - open * 140;
  return { f1, f2, f3 };
}

export function formantsToPoint(f1: number, f2: number): { openness: number; frontness: number } {
  const openness = clamp((f1 - 270) / 680, 0, 1);
  const frontness = clamp((f2 - 760 + openness * 160) / 1580, 0, 1);
  return { openness, frontness };
}

export const CARDINALS: { id: string; label: string; front: number; open: number }[] = [
  { id: "i", label: "i", front: 0.92, open: 0.1 },
  { id: "e", label: "e", front: 0.8, open: 0.32 },
  { id: "ae", label: "æ", front: 0.74, open: 0.7 },
  { id: "a", label: "a", front: 0.5, open: 0.9 },
  { id: "o", label: "o", front: 0.28, open: 0.52 },
  { id: "u", label: "u", front: 0.12, open: 0.16 },
];

function phraseHz(degree: number, tonicPc: number, anchorMidi: number): number {
  let tonic = tonicPc;
  while (tonic < anchorMidi - 6) tonic += 12;
  while (tonic > anchorMidi + 6) tonic -= 12;
  return midiToHz(tonic + degree);
}

export function phraseLabel(art: Articulation, medianF0: number): string {
  const phrase = PHRASES.find((p) => p.id === art.phrase);
  if (!phrase?.degrees?.length) return "Each moment moves toward the nearest scale tone.";
  if (!(medianF0 > 60)) return "Phrase sits in the octave of the take.";
  const anchor = hzToMidi(medianF0);
  const tonic = ((art.keyIndex % 12) + 12) % 12;
  return phrase.degrees.map((degree) => noteName(phraseHz(degree, tonic, anchor))).join(" · ");
}

/** Per-frame target F0 before pitch-strength blend. 0 = unvoiced. */
export function musicalTarget(analysis: Analysis, art: Articulation): Float32Array {
  const n = analysis.f0.length;
  const target = new Float32Array(n);
  const degrees = SCALE_DEGREES[art.scale];
  const tonic = ((art.keyIndex % 12) + 12) % 12;
  const phrase = PHRASES.find((p) => p.id === art.phrase);
  const usePhrase = Boolean(phrase?.degrees && phrase.degrees.length);
  const voicedIdx: number[] = [];
  for (let i = 0; i < n; i++) if (analysis.voiced[i] && analysis.f0[i] > 60) voicedIdx.push(i);

  const anchor =
    analysis.medianF0 > 60 ? hzToMidi(analysis.medianF0) : 60;

  for (let i = 0; i < n; i++) {
    if (!analysis.voiced[i] || analysis.f0[i] < 60) continue;
    if (!usePhrase || !phrase?.degrees) {
      target[i] = snapHz(analysis.f0[i], tonic, degrees);
      continue;
    }
    const pos = voicedIdx.indexOf(i);
    const u = voicedIdx.length <= 1 ? 0 : pos / (voicedIdx.length - 1);
    const scaled = u * phrase.degrees.length;
    const i0 = Math.min(phrase.degrees.length - 1, Math.floor(scaled));
    const i1 = Math.min(phrase.degrees.length - 1, i0 + 1);
    const frac = scaled - i0;
    // Short portamento across the boundary, then hold the note.
    const blend = frac < 0.12 ? frac / 0.12 : 1;
    const h0 = phraseHz(phrase.degrees[i0], tonic, anchor);
    const h1 = phraseHz(phrase.degrees[i1], tonic, anchor);
    const log = Math.log(h0) * (1 - blend) + Math.log(h1) * blend;
    target[i] = Math.exp(log);
  }
  return target;
}

export function correctedContour(analysis: Analysis, art: Articulation): Float32Array {
  const musical = musicalTarget(analysis, art);
  const out = new Float32Array(musical.length);
  const s = clamp(art.pitchStrength, 0, 1);
  for (let i = 0; i < musical.length; i++) {
    if (!(analysis.voiced[i] && analysis.f0[i] > 60 && musical[i] > 60)) continue;
    const t = i * (analysis.hop / analysis.sr);
    const vib =
      art.vibratoCents *
      Math.sin(2 * Math.PI * clamp(art.vibratoRate, 2, 9) * t);
    const goal = musical[i] * Math.pow(2, vib / 1200);
    const log = (1 - s) * Math.log(analysis.f0[i]) + s * Math.log(goal);
    out[i] = clamp(Math.exp(log), 70, 880);
  }
  return out;
}

export function medianCentsAgainst(
  f0: Float32Array,
  voiced: Uint8Array,
  target: Float32Array,
): number {
  const errs: number[] = [];
  const n = Math.min(f0.length, voiced.length, target.length);
  for (let i = 0; i < n; i++) {
    if (!voiced[i] || f0[i] < 60 || target[i] < 60) continue;
    errs.push(Math.abs(1200 * Math.log2(f0[i] / target[i])));
  }
  if (!errs.length) return 999;
  errs.sort((a, b) => a - b);
  return errs[Math.floor(errs.length / 2)];
}
