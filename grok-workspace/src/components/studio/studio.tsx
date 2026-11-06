import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type MutableRefObject } from "react";
import {
  AudioWaveform,
  Download,
  Mic,
  Play,
  Search,
  Shield,
  Square,
  Upload,
} from "lucide-react";
import { analyze } from "@/lib/audio/analyze";
import { makeBenchTake } from "@/lib/audio/bench";
import { renderVocal, type RenderResult } from "@/lib/audio/engine";
import {
  armRecording,
  closeMic,
  disarmRecording,
  getMonitorServerSnap,
  getMonitorSnap,
  onRecordedTake,
  openMic,
  setMonitorArticulation,
  setMonitorAudible,
  subscribeMonitor,
} from "@/lib/audio/monitor";
import { mixdown, playBuffer, resumeAudio, stopPlayback } from "@/lib/audio/playback";
import { planSearch } from "@/lib/audio/search";
import {
  CARDINALS,
  KEYS,
  PHRASES,
  SCALE_DEGREES,
  chartFormants,
  correctedContour,
  formantsToPoint,
  noteName,
  phraseLabel,
  snapHz,
} from "@/lib/audio/scales";
import { synthesizeTube } from "@/lib/audio/tube";
import {
  DEFAULT_ART,
  DEFAULT_CEILINGS,
  type Articulation,
  type Analysis,
  type Ceilings,
  type ScaleName,
  type SearchPlan,
  type Winner,
} from "@/lib/audio/types";
import { conditionLevel, removeDc } from "@/lib/audio/util";
import { encodeWav } from "@/lib/audio/wav";
import { LevelMeter, PitchPlot, Slider, VowelChart, Waveform } from "@/components/studio/widgets";

const CONSENT_KEY = "she-can-sang.consent.v1";
const PARAMS_KEY = "she-can-sang.articulation.v1";

type ConsentEntry = { at: string; decision: "granted" | "revoked"; scope: "reference-audio" };
type Tab = "take" | "shape" | "out";
type Path = "live" | "offline";
type Playing = "take" | "sang" | "stem" | "tube" | null;

const MODEL = [
  ["Pitch strength", "Log-frequency blend from the measured F0 toward the scale or phrase", "TD-PSOLA period placement"],
  ["Vibrato", "Sinusoid on the target F0 only, after the musical target is chosen", "Inside the pitch target, before PSOLA"],
  ["Formant cents", "Uniform vocal-tract length, up is a shorter tract", "Cut at the measured formant, boost at the shifted one"],
  ["Vowel chart", "Jaw openness is F1, tongue frontness is F2", "Same peaking pair, depth follows mix and distance"],
  ["Breath", "Glottal aspiration mixed with the voiced source", "High-passed noise following the amplitude envelope"],
  ["Constriction", "How narrow the supraglottal constriction is", "Unvoiced frames through a band-pass; center rises and Q tightens"],
  ["Velum", "Nasal coupling. Closed is oral", "Low shelf plus a notch near 1 kHz, mostly on voiced samples"],
  ["Burst length", "Stop-release duration", "Detected transients are time-scaled to this many milliseconds"],
  ["Dynamics", "Phrase compression, with a little presence at 3.2 kHz", "Feed-forward compressor after the filter stage"],
] as const;

export function Studio() {
  const [consented, setConsented] = useState(false);
  const [agree, setAgree] = useState(false);
  const [log, setLog] = useState<ConsentEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("take");
  const [path, setPath] = useState<Path>("offline");
  const [hear, setHear] = useState(false);
  const [art, setArt] = useState<Articulation>(DEFAULT_ART);
  const [ceilings, setCeilings] = useState<Ceilings>(DEFAULT_CEILINGS);
  const [latencyCeiling, setLatencyCeiling] = useState(40);
  const [take, setTake] = useState<Float32Array | null>(null);
  const [sr, setSr] = useState(44100);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [plan, setPlan] = useState<SearchPlan | null>(null);
  const [result, setResult] = useState<RenderResult | null>(null);
  const [status, setStatus] = useState("No take yet.");
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState<Playing>(null);
  const manual = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const acceptRef = useRef<(samples: Float32Array, sampleRate: number, note: string) => void>(() => {});

  useEffect(() => {
    try {
      const savedLog = localStorage.getItem(CONSENT_KEY);
      if (savedLog) {
        const parsed = JSON.parse(savedLog) as ConsentEntry[];
        if (Array.isArray(parsed)) {
          setLog(parsed);
          const last = parsed[parsed.length - 1];
          if (last?.decision === "granted") setConsented(true);
        }
      }
      const savedArt = localStorage.getItem(PARAMS_KEY);
      if (savedArt) {
        const parsed = JSON.parse(savedArt) as Partial<Articulation & Ceilings>;
        setArt({ ...DEFAULT_ART, ...pickArt(parsed) });
        manual.current = true;
      }
    } catch {
      /* ignore a broken local log */
    }
    setReady(true);
    return () => {
      closeMic();
      stopPlayback();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(PARAMS_KEY, JSON.stringify(art));
  }, [art, ready]);

  useEffect(() => {
    setMonitorAudible(path === "live" && hear && consented);
  }, [path, hear, consented]);

  useEffect(() => {
    setMonitorArticulation(art);
  }, [art]);

  acceptRef.current = (samples, sampleRate, note) => {
    if (!consented) {
      setStatus("Consent is required before any reference audio is processed.");
      return;
    }
    void ingest(samples, sampleRate, note);
  };

  useEffect(() => onRecordedTake((samples, sampleRate) => acceptRef.current(samples, sampleRate, "Recording stopped at 16 seconds.")), []);

  async function ingest(samples: Float32Array, sampleRate: number, note: string) {
    let audio = removeDc(samples);
    const max = Math.floor(sampleRate * 16);
    let message = note;
    if (audio.length > max) {
      audio = audio.slice(0, max);
      message = `${note} Trimmed to 16 seconds.`;
    }
    if (audio.length < sampleRate * 0.35) {
      setStatus("That take is shorter than a third of a second.");
      return;
    }
    audio = conditionLevel(audio);
    setStatus("Reading pitch and formants…");
    setBusy(true);
    await wait(16);
    try {
      const next = analyze(audio, sampleRate);
      setTake(audio);
      setSr(sampleRate);
      setAnalysis(next);
      setResult(null);
      setArt((prev) => {
        if (manual.current) return prev;
        const point = formantsToPoint(next.f1, next.f2);
        return {
          ...prev,
          breath: Math.round(next.breath * 100) / 100,
          openness: point.openness,
          frontness: point.frontness,
          vowelMix: 0.16,
        };
      });
      const pitched = next.voicedRatio < 0.08 ? " Almost no pitched voice in that take." : "";
      setStatus(`${message}${pitched}`);
      setTab("shape");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not read that take.");
    } finally {
      setBusy(false);
    }
  }

  function patch(partial: Partial<Articulation>) {
    manual.current = true;
    setArt((prev) => ({ ...prev, ...partial }));
  }

  function grant() {
    const entry: ConsentEntry = {
      at: new Date().toISOString(),
      decision: "granted",
      scope: "reference-audio",
    };
    const next = [...log, entry];
    setLog(next);
    localStorage.setItem(CONSENT_KEY, JSON.stringify(next));
    setConsented(true);
    setStatus("Consent stored on this device. Nothing is uploaded.");
  }

  function revoke() {
    const entry: ConsentEntry = {
      at: new Date().toISOString(),
      decision: "revoked",
      scope: "reference-audio",
    };
    const next = [...log, entry];
    setLog(next);
    localStorage.setItem(CONSENT_KEY, JSON.stringify(next));
    setConsented(false);
    setAgree(false);
    setTake(null);
    setAnalysis(null);
    setResult(null);
    setPlan(null);
    closeMic();
    stopPlayback();
    setStatus("Consent revoked. Reference audio was discarded.");
  }

  async function sang() {
    if (!consented) return;
    if (!take || !analysis) {
      setStatus("Load a take first — record, open a file, or use the bench voice.");
      setTab("take");
      return;
    }
    setBusy(true);
    setTab("out");
    try {
      const search = planSearch(analysis, art, ceilings);
      setPlan(search);
      const finalArt = manual.current ? art : { ...art, ...search.winner };
      if (!manual.current) setArt(finalArt);
      setStatus(manual.current ? "Rendering your settings. The search stayed a plan." : "Search winner applied. Rendering.");
      const rendered = await renderVocal(take, analysis, finalArt, setStatus);
      setResult(rendered);
      const report = rendered.report;
      const pitch = `${Math.round(report.inputPitchCents)}¢ off the target, now ${Math.round(report.outputPitchCents)}¢.`;
      if (report.fellBack) {
        setStatus(`Pitch lock fell back to the dry take. Filters still ran. ${pitch}`);
      } else if (report.lufsPass && report.peakPass) {
        setStatus(`Delivery passed. ${pitch}`);
      } else {
        setStatus(`Render finished, but a loudness or true-peak gate failed. Download stays locked. ${pitch}`);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Render failed.");
    } finally {
      setBusy(false);
    }
  }

  function planOnly() {
    if (!analysis) {
      setStatus("Load a take before planning a search.");
      return;
    }
    const search = planSearch(analysis, art, ceilings);
    setPlan(search);
    setStatus(search.ceilingNote);
  }

  function applyWinner(winner: Winner) {
    manual.current = true;
    setArt((prev) => ({ ...prev, ...winner }));
    setStatus("Search candidate copied onto the controls. Render again to hear it.");
  }

  async function play(which: Playing) {
    if (!which) return;
    await resumeAudio();
    const buffer =
      which === "take" ? take : which === "sang" ? result?.vocal ?? null : which === "stem" ? result?.breathStem ?? null : null;
    const rate = which === "take" ? sr : result?.sr ?? sr;
    if (!buffer) return;
    setPlaying(which);
    playBuffer(buffer, rate, () => setPlaying(null));
  }

  async function hearTube() {
    if (!consented) return;
    const ctx = await resumeAudio();
    setStatus("Running the tube…");
    await wait(16);
    const buffer = synthesizeTube({
      sr: ctx.sampleRate,
      duration: 0.85,
      f0: analysis?.medianF0 && analysis.medianF0 > 70 ? analysis.medianF0 : 196,
      openness: art.openness,
      frontness: art.frontness,
      constriction: art.constriction,
      velum: art.velum,
      breath: Math.min(0.4, art.breath),
    });
    setPlaying("tube");
    setStatus("Tube vowel at the take's median pitch. This is the waveguide, not your recording.");
    playBuffer(buffer, ctx.sampleRate, () => setPlaying(null));
  }

  function download(kind: "vocal" | "breath") {
    if (!result) return;
    if (kind === "vocal" && !(result.report.lufsPass && result.report.peakPass)) return;
    const samples = kind === "vocal" ? result.vocal : result.breathStem;
    const bytes = encodeWav(samples, result.sr);
    const blob = new Blob([bytes], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = kind === "vocal" ? "she-can-sang.wav" : "she-can-sang-breath.wav";
    link.click();
    URL.revokeObjectURL(url);
  }

  const target = useMemo(() => (analysis ? correctedContour(analysis, art) : null), [analysis, art]);
  const chart = chartFormants(art.openness, art.frontness);
  const canDeliver = Boolean(result && result.report.lufsPass && result.report.peakPass);

  return (
    <div className="studio">
      <header className="topbar">
        <div className="brand">
          <Mark />
          <div>
            <h1 className="wordmark">She Can Sang</h1>
            <p className="tag">From spoken to studio.</p>
          </div>
        </div>
        <div className="top-actions">
          <div className="seg" role="group" aria-label="Processing path">
            <button type="button" aria-pressed={path === "live"} onClick={() => setPath("live")}>
              Real-time
            </button>
            <button type="button" aria-pressed={path === "offline"} onClick={() => setPath("offline")}>
              Offline
            </button>
          </div>
          <span className="pill">Local only</span>
          {consented ? (
            <button type="button" className="btn" onClick={revoke}>
              <Shield className="icon" aria-hidden="true" />
              Revoke consent
            </button>
          ) : null}
        </div>
      </header>

      <div className="tabs" role="tablist" aria-label="Studio sections">
        {(
          [
            ["take", "Take"],
            ["shape", "Articulation"],
            ["out", "Delivery"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid">
        <section className={tab === "take" ? "panel is-on" : "panel"} aria-label="Take">
          <div className="block">
            <h2 className="kicker">Take</h2>
            <MicControls
              consented={consented}
              allowHear={path === "live"}
              hear={hear}
              setHear={setHear}
              onTake={(samples, sampleRate) => acceptRef.current(samples, sampleRate, "Microphone take.")}
            />
            <div className="row">
              <button type="button" className="btn" disabled={!consented || busy} onClick={() => fileRef.current?.click()}>
                <Upload className="icon" aria-hidden="true" />
                Open file
              </button>
              <button
                type="button"
                className="btn"
                disabled={!consented || busy}
                onClick={() => acceptRef.current(makeBenchTake(44100), 44100, "Bench take. Rough C–E–G–E, drifting pitch, one stop.")}
              >
                <AudioWaveform className="icon" aria-hidden="true" />
                Bench voice
              </button>
              <input
                ref={fileRef}
                hidden
                type="file"
                accept="audio/*,.wav,.mp3,.ogg,.m4a,.flac,.aac"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  void decodeFile(file, acceptRef);
                }}
              />
            </div>
            <p className="status" aria-live="polite">
              {status}
            </p>
          </div>
          <Waveform samples={take} />
          <Identity analysis={analysis} />
          <div className="block">
            <h2 className="kicker">Musical target</h2>
            <div className="row">
              <label className="field">
                Key
                <select
                  className="select"
                  value={art.keyIndex}
                  onChange={(event) => patch({ keyIndex: Number(event.target.value) })}
                >
                  {KEYS.map((key, index) => (
                    <option key={key} value={index}>
                      {key}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Scale
                <select
                  className="select"
                  value={art.scale}
                  onChange={(event) => patch({ scale: event.target.value as ScaleName })}
                >
                  {Object.keys(SCALE_DEGREES).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="row">
              {PHRASES.map((phrase) => (
                <button
                  key={phrase.id}
                  type="button"
                  className="choice"
                  aria-pressed={art.phrase === phrase.id}
                  onClick={() => patch({ phrase: phrase.id })}
                >
                  {phrase.name}
                </button>
              ))}
            </div>
            <p className="hint">{phraseLabel(art, analysis?.medianF0 ?? 0)}</p>
          </div>
        </section>

        <section className={tab === "shape" ? "panel is-on" : "panel"} aria-label="Articulation">
          <div className="block">
            <h2 className="kicker">Vowel chart</h2>
            <p className="hint">
              Drag the point. Openness is jaw, left-to-right is tongue frontness. Cardinals:{" "}
              {CARDINALS.map((vowel) => vowel.label).join(" ")}.
            </p>
            <VowelChart
              openness={art.openness}
              frontness={art.frontness}
              onChange={(frontness, openness) => patch({ frontness, openness })}
            />
            <p className="hint tabular">
              Chart {Math.round(chart.f1)} / {Math.round(chart.f2)} / {Math.round(chart.f3)} Hz
              {analysis
                ? ` · Take ${Math.round(analysis.f1)} / ${Math.round(analysis.f2)} / ${Math.round(analysis.f3)} Hz`
                : ""}
            </p>
          </div>
          <div className="block">
            <Slider
              label="Vowel mix"
              min={0}
              max={1}
              step={0.01}
              value={art.vowelMix}
              display={`${Math.round(art.vowelMix * 100)}%`}
              hint="How hard the chart overrides the formants measured in the take."
              onChange={(vowelMix) => patch({ vowelMix })}
            />
            <Slider
              label="Formant shift"
              min={-200}
              max={200}
              step={1}
              value={art.formantCents}
              display={signed(art.formantCents, "¢")}
              hint="Uniform tract scaling on top of the chart."
              onChange={(formantCents) => patch({ formantCents })}
            />
            <Slider
              label="Pitch strength"
              min={0}
              max={1}
              step={0.01}
              value={art.pitchStrength}
              display={`${Math.round(art.pitchStrength * 100)}%`}
              onChange={(pitchStrength) => patch({ pitchStrength })}
            />
            <Slider
              label="Vibrato depth"
              min={0}
              max={80}
              step={1}
              value={art.vibratoCents}
              display={`${Math.round(art.vibratoCents)}¢`}
              onChange={(vibratoCents) => patch({ vibratoCents })}
            />
            <Slider
              label="Vibrato rate"
              min={3}
              max={8}
              step={0.1}
              value={art.vibratoRate}
              display={`${art.vibratoRate.toFixed(1)} Hz`}
              onChange={(vibratoRate) => patch({ vibratoRate })}
            />
            <Slider
              label="Breath"
              min={0}
              max={1}
              step={0.01}
              value={art.breath}
              display={art.breath.toFixed(2)}
              onChange={(breath) => patch({ breath })}
            />
            <Slider
              label="Constriction"
              min={0}
              max={1}
              step={0.01}
              value={art.constriction}
              display={art.constriction.toFixed(2)}
              hint="Unvoiced noise moves up and narrows as this rises."
              onChange={(constriction) => patch({ constriction })}
            />
            <Slider
              label="Velum opening"
              min={0}
              max={1}
              step={0.01}
              value={art.velum}
              display={art.velum.toFixed(2)}
              onChange={(velum) => patch({ velum })}
            />
            <Slider
              label="Burst length"
              min={8}
              max={80}
              step={1}
              value={art.burstMs}
              display={`${Math.round(art.burstMs)} ms`}
              hint={
                analysis
                  ? analysis.bursts.length
                    ? `${analysis.bursts.length} stop${analysis.bursts.length === 1 ? "" : "s"} will be scaled to this length.`
                    : "No stop burst detected in this take."
                  : "Burst length applies after a take is loaded."
              }
              onChange={(burstMs) => patch({ burstMs })}
            />
            <Slider
              label="Dynamics"
              min={0}
              max={1}
              step={0.01}
              value={art.dynamics}
              display={art.dynamics.toFixed(2)}
              onChange={(dynamics) => patch({ dynamics })}
            />
          </div>
          <div className="block">
            <h2 className="kicker">Consonant timeline</h2>
            <Timeline analysis={analysis} />
            <div className="legend">
              <span><i className="swatch seg-vowel" /> Vowel</span>
              <span><i className="swatch seg-fricative" /> Fricative</span>
              <span><i className="swatch seg-burst" /> Burst</span>
              <span><i className="swatch seg-silence" /> Silence</span>
            </div>
          </div>
          <details className="details">
            <summary>Parameter map</summary>
            <div className="scroll-x">
              <table className="map">
                <thead>
                  <tr>
                    <th>Control</th>
                    <th>Physical reading</th>
                    <th>Where it hits the signal</th>
                  </tr>
                </thead>
                <tbody>
                  {MODEL.map((row) => (
                    <tr key={row[0]}>
                      <td>{row[0]}</td>
                      <td>{row[1]}</td>
                      <td>{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </section>

        <section className={tab === "out" ? "panel is-on" : "panel"} aria-label="Delivery">
          <div className="block">
            <h2 className="kicker">{path === "live" ? "Real-time monitor" : "Offline render"}</h2>
            <p className="hint">
              {path === "live"
                ? "This path is the monitor: formant EQ, nasal notch, compressor, and a cents needle. It does not pitch-lock. Latency is the device figure, checked against your ceiling."
                : "Offline pitch lock is TD-PSOLA, then the formant, nasal, breath and burst stage, then a K-weighted loudness pass aimed at −14 LUFS and −1 dBTP."}
            </p>
            <Tuner path={path} art={art} latencyCeiling={latencyCeiling} />
            {path === "live" ? (
              <Slider
                label="Latency ceiling"
                min={15}
                max={80}
                step={1}
                value={latencyCeiling}
                display={`${latencyCeiling} ms`}
                hint="A gate on the reported device latency. The browser will not open a shorter buffer than this context."
                onChange={setLatencyCeiling}
              />
            ) : null}
          </div>

          <div className="block">
            <h2 className="kicker">Pitch</h2>
            <div className="legend">
              <span>Muted line is the take</span>
              <span>Brass is the target</span>
              <span>Paper is the render</span>
            </div>
            <PitchPlot
              sr={sr}
              hop={analysis?.hop ?? 0}
              take={analysis?.f0 ?? null}
              target={target}
              output={result?.outputF0 ?? null}
              outputHop={result?.outputHop ?? 0}
            />
          </div>

          <div className="block">
            <button type="button" className="btn btn-primary btn-wide" disabled={!consented || busy} onClick={() => void sang()}>
              {busy ? "Working…" : "Sang it"}
            </button>
            <div className="row">
              <button type="button" className="btn" disabled={!analysis || busy} onClick={planOnly}>
                <Search className="icon" aria-hidden="true" />
                Plan only
              </button>
              <button type="button" className="btn" disabled={!consented || busy} onClick={() => void hearTube()}>
                Hear the tube
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  manual.current = false;
                  if (analysis) {
                    const point = formantsToPoint(analysis.f1, analysis.f2);
                    setArt((prev) => ({
                      ...DEFAULT_ART,
                      keyIndex: prev.keyIndex,
                      scale: prev.scale,
                      phrase: prev.phrase,
                      breath: analysis.breath,
                      openness: point.openness,
                      frontness: point.frontness,
                    }));
                  } else setArt(DEFAULT_ART);
                  setStatus("Articulation cleared. The next Sang it will apply the search winner.");
                }}
              >
                Clear manual
              </button>
            </div>
            <p className="hint">
              {manual.current
                ? "Controls are manual. Sang it will not overwrite them."
                : "Controls are still on the search. Sang it applies the winner, then renders."}
            </p>
          </div>

          <div className="block">
            <h2 className="kicker">Search ceilings</h2>
            <Slider
              label="Max pitch lock"
              min={0.3}
              max={1}
              step={0.01}
              value={ceilings.maxPitch}
              display={`${Math.round(ceilings.maxPitch * 100)}%`}
              onChange={(maxPitch) => setCeilings((prev) => ({ ...prev, maxPitch }))}
            />
            <Slider
              label="Max formant move"
              min={0}
              max={150}
              step={1}
              value={ceilings.maxFormant}
              display={`±${Math.round(ceilings.maxFormant)}¢`}
              onChange={(maxFormant) => setCeilings((prev) => ({ ...prev, maxFormant }))}
            />
            {plan ? (
              <div className="plan">
                <p className="hint">{plan.ceilingNote}</p>
                {plan.top.map((candidate, index) => (
                  <button key={`${candidate.cost}-${index}`} type="button" onClick={() => applyWinner(candidate)}>
                    <strong>
                      {index === 0 ? "Winner" : `#${index + 1}`} · cost {candidate.cost.toFixed(2)}
                    </strong>
                    <span className="hint">
                      {" "}
                      pitch {Math.round(candidate.pitchStrength * 100)}% · formant {signed(candidate.formantCents, "¢")} · breath{" "}
                      {candidate.breath.toFixed(2)} · constriction {candidate.constriction.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="hint">The grid scores pitch error, formant distance, breath and constriction. It does not render audio.</p>
            )}
          </div>

          <Gates result={result} />

          <div className="row">
            <button type="button" className="btn" disabled={!take} onClick={() => void play("take")}>
              <Play className="icon" aria-hidden="true" />
              {playing === "take" ? "Take" : "Play take"}
            </button>
            <button type="button" className="btn" disabled={!result} onClick={() => void play("sang")}>
              <Play className="icon" aria-hidden="true" />
              {playing === "sang" ? "Playing" : "Play sang"}
            </button>
            <button type="button" className="btn" disabled={!result} onClick={() => void play("stem")}>
              {playing === "stem" ? "Breath" : "Breath stem"}
            </button>
          </div>
          <div className="row">
            <button type="button" className="btn btn-primary" disabled={!canDeliver} onClick={() => download("vocal")}>
              <Download className="icon" aria-hidden="true" />
              Vocal WAV
            </button>
            <button type="button" className="btn" disabled={!canDeliver} onClick={() => download("breath")}>
              Breath WAV
            </button>
          </div>
          <p className="hint">
            Vocal download stays locked until the loudness and true-peak gates pass. Mono 16-bit. The breath stem is the noise layer, not loudness-matched.
          </p>
          <Waveform samples={result?.vocal ?? null} />
          <p className="footish hint">
            In this browser: TD-PSOLA, an explicit formant stage, a Kelly–Lochbaum tube you can audition, and a local grid search. Not a neural clone. Nothing leaves the device.
          </p>
        </section>
      </div>
      <p className="foot">
        TD-PSOLA pitch lock, formant and tube controls, local grid search. Processing stays in this browser.
      </p>

      {consented ? null : (
        <>
          <div className="scrim" />
          <section className="consent" role="dialog" aria-labelledby="consent-title">
            <p className="kicker">Consent</p>
            <h2 id="consent-title">You know you can’t sing. She can.</h2>
            <p>
              Reference audio — a microphone take, a file, or the bench voice — is refused until you agree. Processing stays in this browser. The agreement is written to a local log. Nothing is uploaded.
            </p>
            <label className="check">
              <input type="checkbox" checked={agree} onChange={(event) => setAgree(event.target.checked)} />
              <span>I agree to process reference audio on this device.</span>
            </label>
            <button type="button" className="btn btn-primary btn-wide" disabled={!agree} onClick={grant}>
              Enter the studio
            </button>
            {log.length ? (
              <details className="details">
                <summary>Local consent log</summary>
                <ul className="log">
                  {log.map((entry, index) => (
                    <li key={`${entry.at}-${index}`}>
                      {entry.at} · {entry.decision} · {entry.scope}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}

function Identity({ analysis }: { analysis: Analysis | null }) {
  if (!analysis) {
    return <p className="hint">Identity numbers appear after a take: median pitch, formants, breath, voiced fraction.</p>;
  }
  return (
    <dl className="stats">
      <div>
        <dt>Median F0</dt>
        <dd>
          {Math.round(analysis.medianF0)} Hz · {noteName(analysis.medianF0)}
        </dd>
      </div>
      <div>
        <dt>Formants</dt>
        <dd>
          {Math.round(analysis.f1)} / {Math.round(analysis.f2)} / {Math.round(analysis.f3)}
        </dd>
      </div>
      <div>
        <dt>Breath</dt>
        <dd>{analysis.breath.toFixed(2)}</dd>
      </div>
      <div>
        <dt>Voiced</dt>
        <dd>{Math.round(analysis.voicedRatio * 100)}%</dd>
      </div>
      <div>
        <dt>Length</dt>
        <dd>{analysis.duration.toFixed(2)} s</dd>
      </div>
      <div>
        <dt>Stops</dt>
        <dd>{analysis.bursts.length}</dd>
      </div>
    </dl>
  );
}

function Timeline({ analysis }: { analysis: Analysis | null }) {
  if (!analysis || analysis.segments.length === 0) {
    return <p className="hint">The consonant timeline fills in from the take: vowels, fricatives, bursts, silence.</p>;
  }
  const span = Math.max(0.001, analysis.duration);
  return (
    <div className="timeline" role="list">
      {analysis.segments.map((segment, index) => (
        <span
          key={`${segment.kind}-${index}`}
          role="listitem"
          className={`seg-bit seg-${segment.kind}`}
          style={{ flexGrow: Math.max(0.02, segment.end - segment.start) }}
          title={`${segment.kind} ${segment.start.toFixed(2)}–${segment.end.toFixed(2)}s`}
        />
      ))}
      <span className="hint" hidden>
        {span}
      </span>
    </div>
  );
}

function Gates({ result }: { result: RenderResult | null }) {
  if (!result) return <p className="hint">Gates report after a render: loudness, true peak, pitch error.</p>;
  const report = result.report;
  return (
    <div className="gates">
      <div className={report.lufsPass ? "gate pass" : "gate fail"}>
        <span>Integrated loudness</span>
        <span>{report.integratedLufs.toFixed(1)} LUFS · target −14</span>
      </div>
      <div className={report.peakPass ? "gate pass" : "gate fail"}>
        <span>True peak</span>
        <span>{report.truePeakDb.toFixed(1)} dBTP · ceiling −1</span>
      </div>
      <div className={report.pitchPass ? "gate pass" : "gate fail"}>
        <span>Pitch error</span>
        <span>
          {Math.round(report.inputPitchCents)}¢ → {Math.round(report.outputPitchCents)}¢
        </span>
      </div>
    </div>
  );
}

function Tuner({ path, art, latencyCeiling }: { path: Path; art: Articulation; latencyCeiling: number }) {
  const snap = useSyncExternalStore(subscribeMonitor, getMonitorSnap, getMonitorServerSnap);
  const target = snap.f0 > 60 ? snapHz(snap.f0, ((art.keyIndex % 12) + 12) % 12, SCALE_DEGREES[art.scale]) : 0;
  const cents = snap.f0 > 60 && target > 0 ? 1200 * Math.log2(snap.f0 / target) : null;
  const latencyPass = !snap.listening || snap.latencyMs <= latencyCeiling;
  return (
    <div className="block">
      <p className="needle" aria-live="polite">
        {cents === null ? "—" : `${cents > 0 ? "+" : ""}${Math.round(cents)}¢`}
      </p>
      <p className="hint">
        {snap.f0 > 60 ? `${noteName(snap.f0)} heard · ${noteName(target)} on the scale` : snap.listening ? "No pitch lock on the input." : "Input is closed."}
      </p>
      <LevelMeter level={snap.level} />
      {path === "live" && snap.listening ? (
        <p className={latencyPass ? "hint" : "hint"} style={latencyPass ? undefined : { color: "var(--color-fault)" }}>
          Device latency {snap.latencyMs.toFixed(0)} ms · ceiling {latencyCeiling} ms · {latencyPass ? "inside budget" : "over ceiling"}
        </p>
      ) : null}
      {snap.error ? <p className="hint">{snap.error}</p> : null}
    </div>
  );
}

function MicControls(props: {
  consented: boolean;
  allowHear: boolean;
  hear: boolean;
  setHear: (value: boolean) => void;
  onTake: (samples: Float32Array, sampleRate: number) => void;
}) {
  const snap = useSyncExternalStore(subscribeMonitor, getMonitorSnap, getMonitorServerSnap);
  const { consented, allowHear, hear, setHear, onTake } = props;
  return (
    <div className="block">
      <div className="row">
        <button
          type="button"
          className={snap.recording ? "btn btn-fault" : "btn btn-primary"}
          disabled={!consented}
          onClick={() => void onRecord(onTake)}
        >
          {snap.recording ? <Square className="icon" aria-hidden="true" /> : <Mic className="icon" aria-hidden="true" />}
          {snap.recording ? `Stop ${snap.seconds.toFixed(1)}s` : snap.listening ? "Record" : "Open input & record"}
        </button>
        {snap.listening ? (
          <button type="button" className="btn" onClick={closeMic}>
            Close input
          </button>
        ) : null}
      </div>
      <label className="check">
        <input
          type="checkbox"
          checked={allowHear && hear}
          disabled={!allowHear || !snap.listening}
          onChange={(event) => setHear(event.target.checked)}
        />
        <span>{allowHear ? "Hear the monitor. Use headphones — the mic can feed back." : "Monitor output is off on the offline path."}</span>
      </label>
      <LevelMeter level={snap.level} />
      {snap.error ? <p className="hint">{snap.error}</p> : null}
    </div>
  );
}

async function onRecord(onTake: (samples: Float32Array, sampleRate: number) => void) {
  if (!getMonitorSnap().listening) await openMic();
  if (!getMonitorSnap().listening) return;
  if (getMonitorSnap().recording) {
    const taken = disarmRecording();
    if (taken) onTake(taken.samples, taken.sampleRate);
    return;
  }
  armRecording();
}

async function decodeFile(
  file: File,
  acceptRef: MutableRefObject<(samples: Float32Array, sampleRate: number, note: string) => void>,
) {
  try {
    const ctx = await resumeAudio();
    const decoded = await ctx.decodeAudioData(await file.arrayBuffer());
    acceptRef.current(mixdown(decoded), decoded.sampleRate, file.name);
  } catch {
    acceptRef.current(new Float32Array(0), 44100, "decode-failed");
  }
}

function pickArt(value: Partial<Articulation>): Partial<Articulation> {
  const next: Partial<Articulation> = {};
  (Object.keys(DEFAULT_ART) as (keyof Articulation)[]).forEach((key) => {
    const incoming = value[key];
    if (typeof incoming === typeof DEFAULT_ART[key]) (next as Record<string, unknown>)[key] = incoming;
  });
  return next;
}

function signed(value: number, unit: string): string {
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${rounded}${unit}`;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function Mark() {
  return (
    <svg className="mark" viewBox="0 0 48 48" aria-hidden="true">
      <rect x="1" y="1" width="46" height="46" rx="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 30c4-10 6-10 8 0s4 10 8 0 4-10 8 0 4 10 8 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );
}
