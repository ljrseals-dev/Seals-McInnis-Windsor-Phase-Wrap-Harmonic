import { pitchTrack } from "./analyze";
import { normalizeDelivery } from "./loudness";
import { tdPsola } from "./psola";
import { correctedContour, medianCentsAgainst, musicalTarget } from "./scales";
import {
  addBreath,
  applyBursts,
  applyFormantsAndNasal,
  compress,
  constrictUnvoiced,
  dcBlock,
  voicedMask,
} from "./shape";
import { peakAbs } from "./util";
import type { Analysis, Articulation } from "./types";

export type RenderReport = {
  integratedLufs: number;
  truePeakDb: number;
  samplePeakDb: number;
  inputPitchCents: number;
  outputPitchCents: number;
  lufsPass: boolean;
  peakPass: boolean;
  pitchPass: boolean;
  pitchThreshold: number;
  fellBack: boolean;
  bursts: number;
};

export type RenderResult = {
  vocal: Float32Array;
  breathStem: Float32Array;
  sr: number;
  report: RenderReport;
  outputF0: Float32Array;
  outputHop: number;
};

export async function renderVocal(
  audio: Float32Array,
  analysis: Analysis,
  art: Articulation,
  onProgress?: (msg: string) => void,
): Promise<RenderResult> {
  const sr = analysis.sr;
  onProgress?.("Placing the target pitch");
  await yieldFrame();
  const musical = musicalTarget(analysis, { ...art, vibratoCents: 0 });
  const inputPitchCents = medianCentsAgainst(analysis.f0, analysis.voiced, musical);
  const target = correctedContour(analysis, art);

  onProgress?.("Relocating periods");
  await yieldFrame();
  let pitchedResult = tdPsola(audio, sr, analysis.f0, target, analysis.voiced, analysis.hop);
  const fellBack = pitchedResult.fellBack;
  let pitched = pitchedResult.signal;
  if (!Number.isFinite(peakAbs(pitched))) throw new Error("Pitch lock produced non-finite audio.");

  onProgress?.("Scoring pitch lock");
  await yieldFrame();
  const tracked = pitchTrack(pitched, sr);
  const alignedTarget = retargetGrid(target, analysis.hop, tracked.hop, tracked.f0.length);
  const outputPitchCents = medianCentsAgainst(tracked.f0, tracked.voiced, alignedTarget);

  onProgress?.("Breath, constriction, formants");
  await yieldFrame();
  const mask = voicedMask(pitched.length, analysis);
  const breathed = addBreath(pitched, sr, art.breath);
  let vocal = constrictUnvoiced(breathed.vocal, sr, mask, art.constriction);
  vocal = applyFormantsAndNasal(vocal, sr, analysis, art, mask);
  let stem = breathed.stem;

  onProgress?.("Burst length and dynamics");
  await yieldFrame();
  vocal = applyBursts(vocal, analysis.bursts, art.burstMs, sr);
  stem = applyBursts(stem, analysis.bursts, art.burstMs, sr);
  const n = Math.min(vocal.length, stem.length);
  vocal = vocal.subarray(0, n);
  stem = stem.subarray(0, n);
  // subarray views must be copies before further mutation-free stages
  vocal = Float32Array.from(vocal);
  stem = Float32Array.from(stem);
  vocal = compress(vocal, sr, art.dynamics);
  vocal = dcBlock(vocal, sr);

  onProgress?.("Loudness and true peak");
  await yieldFrame();
  assertFinite(vocal);
  const delivered = normalizeDelivery(vocal, sr);
  const pitchThreshold = Math.max(30, art.vibratoCents * 0.75 + 14);
  const report: RenderReport = {
    integratedLufs: delivered.measured.integrated,
    truePeakDb: delivered.measured.truePeakDb,
    samplePeakDb: delivered.measured.samplePeakDb,
    inputPitchCents,
    outputPitchCents,
    lufsPass: delivered.measured.integrated >= -16.5 && delivered.measured.integrated <= -11.5,
    peakPass: delivered.measured.truePeakDb <= -0.9,
    pitchPass: outputPitchCents <= pitchThreshold,
    pitchThreshold,
    fellBack,
    bursts: analysis.bursts.length,
  };
  return {
    vocal: delivered.audio,
    breathStem: stem,
    sr,
    report,
    outputF0: tracked.f0,
    outputHop: tracked.hop,
  };
}

function retargetGrid(src: Float32Array, srcHop: number, dstHop: number, dstLen: number): Float32Array {
  const out = new Float32Array(dstLen);
  for (let i = 0; i < dstLen; i++) {
    const sample = i * dstHop;
    const sf = sample / srcHop;
    const i0 = Math.max(0, Math.min(src.length - 1, Math.round(sf)));
    out[i] = src[i0] ?? 0;
  }
  return out;
}

function assertFinite(x: Float32Array) {
  for (let i = 0; i < x.length; i++) {
    if (!Number.isFinite(x[i])) throw new Error("Render produced a non-finite sample.");
  }
}

function yieldFrame(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
