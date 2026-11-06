import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { CARDINALS, chartFormants } from "@/lib/audio/scales";

export function Slider(props: {
  label: string;
  hint?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  display: string;
  onChange: (value: number) => void;
}) {
  const { label, hint, min, max, step, value, display, onChange } = props;
  return (
    <label className="slider">
      <span className="slider-top">
        <span>{label}</span>
        <b>{display}</b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={display}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {hint ? <span className="hint">{hint}</span> : null}
    </label>
  );
}

export function Waveform({ samples }: { samples: Float32Array | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => {
      const width = canvas.clientWidth || 300;
      const height = canvas.clientHeight || 72;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      const g = canvas.getContext("2d");
      if (!g) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const styles = getComputedStyle(document.documentElement);
      g.clearRect(0, 0, width, height);
      g.fillStyle = styles.getPropertyValue("--color-brass").trim() || "#e0a24a";
      if (!samples || samples.length < 2) {
        g.globalAlpha = 0.35;
        g.fillRect(0, height / 2, width, 1);
        return;
      }
      const buckets = Math.max(40, Math.floor(width / 3));
      const step = samples.length / buckets;
      const mid = height / 2;
      for (let i = 0; i < buckets; i++) {
        const a = Math.floor(i * step);
        const b = Math.max(a + 1, Math.floor((i + 1) * step));
        let peak = 0;
        for (let j = a; j < b && j < samples.length; j++) peak = Math.max(peak, Math.abs(samples[j]));
        const h = Math.max(1, peak * (height - 4));
        g.globalAlpha = 0.9;
        g.fillRect(i * (width / buckets), mid - h / 2, Math.max(1, width / buckets - 1), h);
      }
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [samples]);
  return <canvas ref={ref} className="wave" role="img" aria-label="Waveform of the current buffer" />;
}

export function PitchPlot(props: {
  sr: number;
  hop: number;
  take: Float32Array | null;
  target: Float32Array | null;
  output: Float32Array | null;
  outputHop: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { sr, hop, take, target, output, outputHop } = props;
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => {
      const width = canvas.clientWidth || 300;
      const height = canvas.clientHeight || 120;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      const g = canvas.getContext("2d");
      if (!g) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const styles = getComputedStyle(document.documentElement);
      const muted = styles.getPropertyValue("--color-muted").trim() || "#a39886";
      const brass = styles.getPropertyValue("--color-brass").trim() || "#e0a24a";
      const fg = styles.getPropertyValue("--color-fg").trim() || "#f3eadc";
      const line = styles.getPropertyValue("--color-line").trim() || "#3a342a";
      g.clearRect(0, 0, width, height);
      g.strokeStyle = line;
      g.lineWidth = 1;
      for (const hz of [100, 200, 400]) {
        const y = yOf(hz, height);
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(width, y);
        g.stroke();
      }
      const duration =
        take && hop ? (take.length * hop) / sr : output && outputHop ? (output.length * outputHop) / sr : 1;
      stroke(g, take, hop, sr, duration, width, height, muted, 1.4);
      stroke(g, target, hop, sr, duration, width, height, brass, 1.6);
      stroke(g, output, outputHop, sr, duration, width, height, fg, 1.5);
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [sr, hop, take, target, output, outputHop]);
  return <canvas ref={ref} className="pitch" role="img" aria-label="Pitch of the take, the target, and the render" />;
}

function yOf(hz: number, height: number): number {
  const min = Math.log(70);
  const max = Math.log(800);
  const t = (Math.log(Math.min(800, Math.max(70, hz))) - min) / (max - min);
  return height - 8 - t * (height - 16);
}

function stroke(
  g: CanvasRenderingContext2D,
  series: Float32Array | null,
  hop: number,
  sr: number,
  duration: number,
  width: number,
  height: number,
  color: string,
  widthPx: number,
) {
  if (!series || !hop || !sr) return;
  g.beginPath();
  let moved = false;
  g.strokeStyle = color;
  g.lineWidth = widthPx;
  for (let i = 0; i < series.length; i++) {
    const f = series[i];
    if (!(f > 60)) {
      moved = false;
      continue;
    }
    const x = ((i * hop) / sr / Math.max(0.001, duration)) * width;
    const y = yOf(f, height);
    if (!moved) {
      g.moveTo(x, y);
      moved = true;
    } else g.lineTo(x, y);
  }
  g.stroke();
}

export function VowelChart(props: {
  openness: number;
  frontness: number;
  onChange: (frontness: number, openness: number) => void;
}) {
  const { openness, frontness, onChange } = props;
  const width = 320;
  const height = 230;
  const pad = 16;
  function fromEvent(event: ReactPointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const front = clamp01((x * width - pad) / (width - pad * 2));
    const open = clamp01((y * height - pad) / (height - pad * 2));
    onChange(front, open);
  }
  const cx = pad + frontness * (width - pad * 2);
  const cy = pad + openness * (height - pad * 2);
  const hz = chartFormants(openness, frontness);
  return (
    <div className="block">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="vowel-svg"
        role="application"
        aria-label="Vowel chart. Drag to set tongue frontness and jaw openness."
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          fromEvent(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) fromEvent(event);
        }}
      >
        <polygon
          points={`${pad + 0.92 * (width - pad * 2)},${pad + 0.08 * (height - pad * 2)} ${pad + 0.5 * (width - pad * 2)},${pad + 0.94 * (height - pad * 2)} ${pad + 0.08 * (width - pad * 2)},${pad + 0.14 * (height - pad * 2)}`}
          fill="none"
          stroke="currentColor"
          opacity="0.35"
        />
        {CARDINALS.map((vowel) => (
          <g key={vowel.id}>
            <circle
              cx={pad + vowel.front * (width - pad * 2)}
              cy={pad + vowel.open * (height - pad * 2)}
              r="3"
              fill="currentColor"
              opacity="0.45"
            />
            <text
              x={pad + vowel.front * (width - pad * 2) + 6}
              y={pad + vowel.open * (height - pad * 2) + 4}
              fill="currentColor"
              opacity="0.6"
              fontSize="12"
            >
              {vowel.label}
            </text>
          </g>
        ))}
        <circle cx={cx} cy={cy} r="8" fill="var(--color-brass)" />
      </svg>
      <div className="row">
        {CARDINALS.map((vowel) => (
          <button
            key={vowel.id}
            type="button"
            className="choice"
            aria-pressed={Math.abs(frontness - vowel.front) < 0.03 && Math.abs(openness - vowel.open) < 0.03}
            onClick={() => onChange(vowel.front, vowel.open)}
          >
            {vowel.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

export function LevelMeter({ level }: { level: number }) {
  const pct = Math.min(100, Math.round(level * 280));
  return (
    <div className="meter" aria-hidden="true">
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}
