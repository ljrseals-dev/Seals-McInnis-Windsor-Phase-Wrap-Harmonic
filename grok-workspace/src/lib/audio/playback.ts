let ctx: AudioContext | null = null;
let current: AudioBufferSourceNode | null = null;

export function audioContext(): AudioContext {
  if (!ctx) ctx = new AudioContext({ latencyHint: "interactive" });
  return ctx;
}

export async function resumeAudio(): Promise<AudioContext> {
  const c = audioContext();
  if (c.state === "suspended") await c.resume();
  return c;
}

export function stopPlayback() {
  try {
    current?.stop();
  } catch {
    /* already stopped */
  }
  current = null;
}

export function playBuffer(samples: Float32Array, sr: number, onEnded?: () => void) {
  const c = audioContext();
  stopPlayback();
  const buffer = c.createBuffer(1, samples.length, sr);
  buffer.copyToChannel(samples, 0);
  const src = c.createBufferSource();
  src.buffer = buffer;
  src.connect(c.destination);
  src.onended = () => {
    if (current === src) current = null;
    onEnded?.();
  };
  current = src;
  src.start();
}

export function mixdown(buffer: AudioBuffer): Float32Array {
  const n = buffer.length;
  const out = new Float32Array(n);
  const chs = buffer.numberOfChannels;
  for (let c = 0; c < chs; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < n; i++) out[i] += data[i];
  }
  const g = 1 / Math.max(1, chs);
  for (let i = 0; i < n; i++) out[i] *= g;
  return out;
}
