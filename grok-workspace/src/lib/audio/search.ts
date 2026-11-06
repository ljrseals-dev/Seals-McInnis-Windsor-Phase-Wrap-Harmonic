import { medianCentsAgainst, musicalTarget } from "./scales";
import { clamp } from "./util";
import type { Analysis, Articulation, Ceilings, SearchCandidate, SearchPlan, Winner } from "./types";

/**
 * Exhaustive grid over pitch lock, formant cents, breath and constriction.
 * Scoring is analytical — no resynthesis — so the plan stays inside a few milliseconds.
 * The preferred point is a measured enhancement: lock pitch, brighten slightly,
 * clean a little breath, keep a moderate consonant constriction.
 */
export function planSearch(analysis: Analysis, art: Articulation, ceilings: Ceilings): SearchPlan {
  const musical = musicalTarget(analysis, { ...art, vibratoCents: 0 });
  const deviation = medianCentsAgainst(analysis.f0, analysis.voiced, musical);
  const maxPitch = clamp(ceilings.maxPitch, 0, 1);
  const maxFormant = clamp(ceilings.maxFormant, 0, 200);
  const pitchGrid = [0.4, 0.65, 0.85, 1].filter((v) => v <= maxPitch + 1e-6);
  if (!pitchGrid.length) pitchGrid.push(maxPitch);
  const formantGrid = [-50, -15, 0, 18, 40, 65].filter((v) => Math.abs(v) <= maxFormant + 1e-6);
  if (!formantGrid.length) formantGrid.push(0);
  const b = clamp(analysis.breath, 0, 1);
  const breathGrid = unique([
    clamp(b * 0.55, 0, 1),
    clamp(b * 0.8, 0, 1),
    clamp(b, 0, 1),
    clamp(b + 0.08, 0, 1),
  ]);
  const consGrid = [0.22, 0.36, 0.48, 0.64];

  const breathTarget = clamp(b * 0.72, 0.04, 0.5);
  const formantTarget = 16;
  const consTarget = 0.4;

  const top: SearchCandidate[] = [];
  let evaluated = 0;
  for (const pitchStrength of pitchGrid) {
    for (const formantCents of formantGrid) {
      for (const breath of breathGrid) {
        for (const constriction of consGrid) {
          evaluated++;
          const residual = (1 - pitchStrength) * (deviation >= 900 ? 80 : deviation);
          const pitch = residual / 100;
          const formant = Math.abs(formantCents - formantTarget) / 80;
          const breathCost = Math.abs(breath - breathTarget) / 0.28;
          const constrictionCost = Math.abs(constriction - consTarget) / 0.45;
          const identity = Math.abs(formantCents) / 160;
          const cost = pitch * 1.7 + formant * 0.65 + breathCost * 0.75 + constrictionCost * 0.45 + identity * 0.35;
          const row: SearchCandidate = {
            pitchStrength,
            formantCents,
            breath,
            constriction,
            cost,
            pitch,
            formant,
            breathCost,
            constrictionCost,
          };
          insertTop(top, row, 5);
        }
      }
    }
  }
  top.sort((a, c) => a.cost - c.cost);
  const winner: Winner = top[0] ?? {
    pitchStrength: maxPitch,
    formantCents: 0,
    breath: breathTarget,
    constriction: consTarget,
  };
  return {
    evaluated,
    ceilingNote: `${evaluated} local scores · pitch ≤ ${Math.round(maxPitch * 100)}% · formant ≤ ±${Math.round(maxFormant)}¢ · no audio rendered`,
    winner,
    top,
  };
}

function unique(xs: number[]): number[] {
  const out: number[] = [];
  for (const v of xs) {
    const r = Math.round(v * 1000) / 1000;
    if (!out.some((o) => Math.abs(o - r) < 0.01)) out.push(r);
  }
  return out;
}

function insertTop(top: SearchCandidate[], row: SearchCandidate, limit: number) {
  if (top.length < limit) {
    top.push(row);
    return;
  }
  let worst = 0;
  for (let i = 1; i < top.length; i++) if (top[i].cost > top[worst].cost) worst = i;
  if (row.cost < top[worst].cost) top[worst] = row;
}
