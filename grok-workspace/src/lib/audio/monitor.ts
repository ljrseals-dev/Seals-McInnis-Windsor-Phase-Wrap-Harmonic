import { chartFormants } from "./scales";
import { estimatePitch } from "./yin";
import { audioContext, resumeAudio } from "./playback";
import type { Articulation } from "./types";

export type MonitorSnap = {
  listening: boolean;
  recording: boolean;
  seconds: number;
  level: number;
  f0: number;
  latencyMs: number;
  error: string | null;
  sampleRate: number;
};

const serverSnap: MonitorSnap = {
  listening: false,
  recording: false,
  seconds: 0,
  level: 0,
  f0: 0,
  latencyMs: 0,
  error: null,
  sampleRate: 0,
};

let snap: MonitorSnap = { ...serverSnap };
const listeners = new Set<() => void>();

type Graph = {
  stream: MediaStream;
  source: MediaStreamAudioSourceNode;
  hp: BiquadFilterNode;
  f1: BiquadFilterNode;
  f2: BiquadFilterNode;
  f3: BiquadFilterNode;
  nasal: BiquadFilterNode;
  comp: DynamicsCompressorNode;
  gain: GainNode;
  analyser: AnalyserNode;
  tap: ScriptProcessorNode;
  silent: GainNode;
};

let graph: Graph | null = null;
let raf = 0;
let chunks: Float32Array[] = [];
let recorded = 0;
const MAX_SEC = 16;
const takeHandlers = new Set<(samples: Float32Array, sampleRate: number) => void>();
let timeBuf: Float32Array | null = null;
let lastPitch = 0;

export function subscribeMonitor(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getMonitorSnap(): MonitorSnap {
  return snap;
}

export function getMonitorServerSnap(): MonitorSnap {
  return serverSnap;
}

function emit(partial: Partial<MonitorSnap>) {
  snap = { ...snap, ...partial };
  for (const listener of listeners) listener();
}

export async function openMic(): Promise<void> {
  if (graph) return;
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    emit({ error: "This browser has no microphone API." });
    return;
  }
  try {
    const ctx = await resumeAudio();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      video: false,
    });
    const source = ctx.createMediaStreamSource(stream);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 80;
    const f1 = peak(ctx);
    const f2 = peak(ctx);
    const f3 = peak(ctx);
    const nasal = ctx.createBiquadFilter();
    nasal.type = "peaking";
    nasal.frequency.value = 1050;
    nasal.Q.value = 1.2;
    nasal.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 8;
    comp.attack.value = 0.005;
    comp.release.value = 0.08;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.35;
    const tap = ctx.createScriptProcessor(2048, 1, 1);
    const silent = ctx.createGain();
    silent.gain.value = 0;
    source.connect(hp);
    hp.connect(f1);
    f1.connect(f2);
    f2.connect(f3);
    f3.connect(nasal);
    nasal.connect(comp);
    comp.connect(gain);
    gain.connect(ctx.destination);
    source.connect(analyser);
    source.connect(tap);
    tap.connect(silent);
    silent.connect(ctx.destination);
    tap.onaudioprocess = (event) => {
      if (!snap.recording) return;
      const input = event.inputBuffer.getChannelData(0);
      chunks.push(new Float32Array(input));
      recorded += input.length;
      const sr = event.inputBuffer.sampleRate;
      if (recorded >= sr * MAX_SEC) {
        const taken = takeBuffer(sr);
        emit({ recording: false, seconds: MAX_SEC });
        if (taken) for (const handler of takeHandlers) handler(taken.samples, taken.sampleRate);
      }
    };
    graph = { stream, source, hp, f1, f2, f3, nasal, comp, gain, analyser, tap, silent };
    timeBuf = new Float32Array(analyser.fftSize);
    const latencyMs = ((ctx.baseLatency || 0) + (ctx.outputLatency || 0)) * 1000;
    emit({
      listening: true,
      error: null,
      sampleRate: ctx.sampleRate,
      latencyMs,
    });
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Microphone permission was refused.";
    emit({ error: message, listening: false });
  }
}

function peak(ctx: AudioContext): BiquadFilterNode {
  const node = ctx.createBiquadFilter();
  node.type = "peaking";
  node.Q.value = 3;
  node.gain.value = 0;
  return node;
}

function loop() {
  if (!graph || !timeBuf) return;
  graph.analyser.getFloatTimeDomainData(timeBuf as Float32Array<ArrayBuffer>);
  let s = 0;
  for (let i = 0; i < timeBuf.length; i++) s += timeBuf[i] * timeBuf[i];
  const level = Math.sqrt(s / timeBuf.length);
  const now = performance.now();
  let f0 = snap.f0;
  if (now - lastPitch > 90) {
    lastPitch = now;
    const est = estimatePitch(timeBuf, graph.source.context.sampleRate);
    f0 = est.clarity > 0.7 ? est.f0 : 0;
  }
  const seconds = graph ? recorded / (snap.sampleRate || 1) : 0;
  emit({ level, f0, seconds: snap.recording ? seconds : snap.seconds });
  raf = requestAnimationFrame(loop);
}

export function closeMic() {
  cancelAnimationFrame(raf);
  raf = 0;
  if (graph) {
    graph.tap.onaudioprocess = null;
    graph.stream.getTracks().forEach((track) => track.stop());
    graph.source.disconnect();
    graph.gain.disconnect();
    graph.tap.disconnect();
    graph = null;
  }
  chunks = [];
  recorded = 0;
  emit({ listening: false, recording: false, level: 0, f0: 0, seconds: 0 });
}

export function setMonitorAudible(on: boolean) {
  if (!graph) return;
  const ctx = audioContext();
  graph.gain.gain.setTargetAtTime(on ? 0.85 : 0, ctx.currentTime, 0.03);
}

export function setMonitorArticulation(art: Articulation) {
  if (!graph) return;
  const ctx = audioContext();
  const now = ctx.currentTime;
  const chart = chartFormants(art.openness, art.frontness);
  const ratio = Math.pow(2, art.formantCents / 1200);
  const depth = art.vowelMix * 7;
  tune(graph.f1, chart.f1 * ratio, depth, now);
  tune(graph.f2, chart.f2 * ratio, depth * 0.85, now);
  tune(graph.f3, chart.f3 * ratio, depth * 0.6, now);
  graph.nasal.gain.setTargetAtTime(-10 * art.velum, now, 0.04);
  graph.comp.ratio.setTargetAtTime(1 + art.dynamics * 4, now, 0.04);
  graph.comp.threshold.setTargetAtTime(-14 - art.dynamics * 10, now, 0.04);
}

function tune(node: BiquadFilterNode, freq: number, gain: number, now: number) {
  node.frequency.setTargetAtTime(Math.max(80, freq), now, 0.04);
  node.gain.setTargetAtTime(gain, now, 0.04);
}

export function onRecordedTake(handler: (samples: Float32Array, sampleRate: number) => void) {
  takeHandlers.add(handler);
  return () => takeHandlers.delete(handler);
}

export function armRecording() {
  if (!graph) return;
  chunks = [];
  recorded = 0;
  emit({ recording: true, seconds: 0, error: null });
}

export function disarmRecording(): { samples: Float32Array; sampleRate: number } | null {
  const sr = snap.sampleRate || 44100;
  const taken = takeBuffer(sr);
  emit({ recording: false, seconds: taken ? taken.samples.length / sr : 0 });
  return taken;
}

function takeBuffer(sr: number): { samples: Float32Array; sampleRate: number } | null {
  if (!chunks.length) return null;
  let n = 0;
  for (const c of chunks) n += c.length;
  const samples = new Float32Array(n);
  let offset = 0;
  for (const c of chunks) {
    samples.set(c, offset);
    offset += c.length;
  }
  chunks = [];
  recorded = 0;
  return { samples, sampleRate: sr };
}
