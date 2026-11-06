export type ScaleName = "major" | "minor" | "pentatonic" | "chromatic";

export type SegmentKind = "vowel" | "fricative" | "burst" | "silence";

export type Segment = {
  start: number;
  end: number;
  kind: SegmentKind;
};

export type Burst = { start: number; end: number };

export type Analysis = {
  sr: number;
  hop: number;
  f0: Float32Array;
  voiced: Uint8Array;
  clarity: Float32Array;
  rms: Float32Array;
  zcr: Float32Array;
  medianF0: number;
  f1: number;
  f2: number;
  f3: number;
  breath: number;
  voicedRatio: number;
  brightness: number;
  bursts: Burst[];
  segments: Segment[];
  duration: number;
};

export type Articulation = {
  pitchStrength: number;
  formantCents: number;
  breath: number;
  constriction: number;
  velum: number;
  burstMs: number;
  vibratoCents: number;
  vibratoRate: number;
  vowelMix: number;
  openness: number;
  frontness: number;
  dynamics: number;
  keyIndex: number;
  scale: ScaleName;
  phrase: string;
};

export type Ceilings = {
  maxPitch: number;
  maxFormant: number;
};

export type Winner = Pick<
  Articulation,
  "pitchStrength" | "formantCents" | "breath" | "constriction"
>;

export type SearchCandidate = Winner & {
  cost: number;
  pitch: number;
  formant: number;
  breathCost: number;
  constrictionCost: number;
};

export type SearchPlan = {
  evaluated: number;
  ceilingNote: string;
  winner: Winner;
  top: SearchCandidate[];
};

export const DEFAULT_ART: Articulation = {
  pitchStrength: 0.92,
  formantCents: 0,
  breath: 0.16,
  constriction: 0.4,
  velum: 0.08,
  burstMs: 28,
  vibratoCents: 8,
  vibratoRate: 5.2,
  vowelMix: 0.18,
  openness: 0.56,
  frontness: 0.5,
  dynamics: 0.42,
  keyIndex: 0,
  scale: "major",
  phrase: "snap",
};

export const DEFAULT_CEILINGS: Ceilings = {
  maxPitch: 1,
  maxFormant: 70,
};
