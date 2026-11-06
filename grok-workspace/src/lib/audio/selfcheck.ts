import { analyze, pitchTrack } from "./analyze";
import { makeBenchTake } from "./bench";
import { renderVocal } from "./engine";
import { fft, ifft } from "./fft";
import { planSearch } from "./search";
import { correctedContour } from "./scales";
import { synthesizeTube } from "./tube";
import { DEFAULT_ART, DEFAULT_CEILINGS } from "./types";
import { estimatePitch } from "./yin";
import { encodeWav } from "./wav";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function checkFft() {
  const re = new Float64Array([1, 2, 3, 4, 0, 0, 0, 0]);
  const im = new Float64Array(8);
  fft(re, im);
  ifft(re, im);
  for (const expected of [1, 2, 3, 4]) {
    const got = re[[1, 2, 3, 4].indexOf(expected)];
    assert(Math.abs(got - expected) < 1e-6, `fft roundtrip ${expected} → ${got}`);
  }
}

function checkYin() {
  const sr = 11025;
  const f = 220;
  const frame = new Float32Array(1024);
  for (let i = 0; i < frame.length; i++) frame[i] = Math.sin((2 * Math.PI * f * i) / sr);
  const est = estimatePitch(frame, sr);
  assert(Math.abs(est.f0 - f) < 3, `yin ${est.f0.toFixed(2)} clarity ${est.clarity.toFixed(2)}`);
  assert(est.clarity > 0.8, `yin clarity ${est.clarity}`);
}

async function main() {
  checkFft();
  checkYin();
  const sr = 22050;
  const bench = makeBenchTake(sr);
  const t0 = Date.now();
  const analysis = analyze(bench, sr);
  console.log(
    JSON.stringify({
      medianF0: Math.round(analysis.medianF0),
      formants: [Math.round(analysis.f1), Math.round(analysis.f2), Math.round(analysis.f3)],
      breath: Number(analysis.breath.toFixed(3)),
      voiced: Number(analysis.voicedRatio.toFixed(2)),
      bursts: analysis.bursts.length,
      analyzeMs: Date.now() - t0,
    }),
  );
  assert(analysis.voicedRatio > 0.45, `voiced ratio ${analysis.voicedRatio}`);
  assert(analysis.medianF0 > 180 && analysis.medianF0 < 520, `median f0 ${analysis.medianF0}`);

  const art = {
    ...DEFAULT_ART,
    pitchStrength: 1,
    vibratoCents: 0,
    vowelMix: 0,
    formantCents: 0,
    breath: 0.04,
    dynamics: 0.15,
    constriction: 0.3,
    velum: 0.05,
  };
  const plan = planSearch(analysis, art, DEFAULT_CEILINGS);
  assert(plan.evaluated > 20, "search did not evaluate");
  assert(plan.top.length > 0, "search empty");

  const rendered = await renderVocal(bench, analysis, art);
  const track = pitchTrack(rendered.vocal, sr);
  console.log(
    JSON.stringify({
      render: rendered.report,
      outVoiced: track.voiced.reduce((s, v) => s + v, 0) / track.voiced.length,
      wavBytes: encodeWav(rendered.vocal, sr).byteLength,
      plan: plan.winner,
      planN: plan.evaluated,
      ms: Date.now() - t0,
    }),
  );
  assert(rendered.report.lufsPass, `lufs ${rendered.report.integratedLufs}`);
  assert(rendered.report.peakPass, `peak ${rendered.report.truePeakDb}`);
  assert(!rendered.report.fellBack, "psola fell back to the dry take");
  assert(
    rendered.report.outputPitchCents < rendered.report.inputPitchCents,
    `pitch did not improve in ${rendered.report.inputPitchCents} out ${rendered.report.outputPitchCents}`,
  );
  assert(analysis.bursts.length >= 1, "bench burst was not detected");
  assert(analysis.f2 > 900 && analysis.f2 < 1800, `f2 ${analysis.f2}`);
  assert(rendered.report.inputPitchCents > 25, `input not detuned enough ${rendered.report.inputPitchCents}`);

  const contour = correctedContour(analysis, art);
  assert(contour.some((v) => v > 0), "empty contour");

  const tubeA = synthesizeTube({
    sr: 22050,
    duration: 0.35,
    f0: 180,
    openness: 0.9,
    frontness: 0.45,
    constriction: 0.3,
    velum: 0.04,
    breath: 0.05,
  });
  const tubeI = synthesizeTube({
    sr: 22050,
    duration: 0.35,
    f0: 180,
    openness: 0.1,
    frontness: 0.94,
    constriction: 0.62,
    velum: 0.04,
    breath: 0.05,
  });
  const cA = centroid(tubeA, 22050);
  const cI = centroid(tubeI, 22050);
  console.log(JSON.stringify({ tubeCentroidA: Math.round(cA), tubeCentroidI: Math.round(cI) }));
  assert(cA > 80 && cI > 80, "tube silent");
  assert(cI > cA * 1.05, `expected /i/ brighter than /a/ (${cI} vs ${cA})`);
  console.log("selfcheck ok");
}

function centroid(x: Float32Array, sr: number): number {
  const N = 2048;
  const re = new Float64Array(N);
  const im = new Float64Array(N);
  const start = Math.floor(x.length / 3);
  for (let i = 0; i < N; i++) {
    const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1));
    re[i] = (x[start + i] || 0) * w;
  }
  fft(re, im);
  let num = 0;
  let den = 0;
  for (let k = 1; k < N / 2; k++) {
    const mag = Math.hypot(re[k], im[k]);
    const f = (k * sr) / N;
    num += f * mag;
    den += mag;
  }
  return den > 0 ? num / den : 0;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
