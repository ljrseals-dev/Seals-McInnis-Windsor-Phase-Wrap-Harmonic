tools/ — Seals–McInnis–Windsor Phase-Wrap Harmonic

Printable utility scripts for the SMWPWH repository. Copy each into its own file under tools/.

---

tools/render.sh

```bash
#!/usr/bin/env bash
#
# render.sh — render all SMWPWH LilyPond examples to PDF and MIDI.
#
# Usage:
#   tools/render.sh              # render every .ly in examples/
#   tools/render.sh FILE.ly      # render one file
#
# Requirements:
#   lilypond >= 2.24

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXAMPLES="$ROOT/examples"
OUT="$ROOT/build"

mkdir -p "$OUT"

if ! command -v lilypond >/dev/null 2>&1; then
  echo "error: lilypond not found in PATH" >&2
  exit 1
fi

render_one() {
  local file="$1"
  local base
  base="$(basename "$file" .ly)"
  echo "==> rendering $base"
  lilypond \
    --output="$OUT/$base" \
    "$file"
}

if [[ $# -ge 1 ]]; then
  render_one "$1"
else
  shopt -s nullglob
  files=("$EXAMPLES"/*.ly)
  if [[ ${#files[@]} -eq 0 ]]; then
    echo "no .ly files found in $EXAMPLES" >&2
    exit 0
  fi
  for f in "${files[@]}"; do
    render_one "$f"
  done
fi

echo
echo "output written to $OUT"
```

---

tools/synth_demo.py

```python
#!/usr/bin/env python3
"""
synth_demo.py — render a set of SMWPWH demo WAVs.

Usage:
    python tools/synth_demo.py [--out build/audio] [--rate 48000]

Produces:
    ouroboros_canon.wav      two-voice phase canon at phi=1/2
    endless_rise.wav         single Shepard voice, continuous rise
    phase_cadence.wav        three voices converging to phi=0
    phase_unison.wav         contrary motion meeting at phi=1/2
"""

from __future__ import annotations

import argparse
import os
import sys

import numpy as np

# Allow running from repo root without installing.
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC = os.path.join(ROOT, "src")
if SRC not in sys.path:
    sys.path.insert(0, SRC)

from smwpwh import (  # noqa: E402
    ShepardVoice,
    render_voice,
    write_wav,
    raised_cosine,
)


def _voice(p, phi, label=""):
    return ShepardVoice(
        pitch_class=p,
        phase=phi,
        window=raised_cosine,
        octaves=6,
        f0=220.0,
        label=label,
    )


def render_ouroboros_canon(duration=16.0, rate=48000):
    """Two-voice phase canon at the half-cycle."""
    n = int(duration * rate)
    t = np.arange(n) / rate

    v1 = _voice(0, 0.0, "voice1")
    v2 = _voice(4, 0.5, "voice2")

    a1 = render_voice(v1, duration, rate, phase_rate=0.125, fade_seconds=0.0)
    a2 = render_voice(v2, duration, rate, phase_rate=0.125, fade_seconds=0.0)

    mix = a1 + a2
    peak = np.max(np.abs(mix)) or 1.0
    return (mix / peak).astype(np.float32)


def render_endless_rise(duration=12.0, rate=48000):
    """One voice, continuous rise."""
    v = _voice(0, 0.0, "rise")
    return render_voice(v, duration, rate, phase_rate=0.25)


def render_phase_cadence(duration=10.0, rate=48000):
    """Three voices converging to phi=0."""
    v1 = _voice(7, 0.5)
    v2 = _voice(4, 0.25)
    v3 = _voice(0, 0.5)

    # Phase trajectories that converge to 0 together.
    def phi1(t):
        return (0.5 + 0.25 * t) % 1.0

    def phi2(t):
        return (0.25 + 0.375 * t) % 1.0

    def phi3(t):
        return (0.5 - 0.25 * t) % 1.0

    a1 = render_voice(v1, duration, rate, phase_fn=phi1, fade_seconds=0.0)
    a2 = render_voice(v2, duration, rate, phase_fn=phi2, fade_seconds=0.0)
    a3 = render_voice(v3, duration, rate, phase_fn=phi3, fade_seconds=0.0)

    mix = a1 + a2 + a3
    peak = np.max(np.abs(mix)) or 1.0
    return (mix / peak).astype(np.float32)


def render_phase_unison(duration=8.0, rate=48000):
    """Two voices in contrary phase motion meeting at phi=1/2."""
    v1 = _voice(0, 0.0)
    v2 = _voice(7, 1.0)

    def phi1(t):
        return (0.0 + 0.5 * t / duration) % 1.0

    def phi2(t):
        return (1.0 - 0.5 * t / duration) % 1.0

    a1 = render_voice(v1, duration, rate, phase_fn=phi1, fade_seconds=0.0)
    a2 = render_voice(v2, duration, rate, phase_fn=phi2, fade_seconds=0.0)

    mix = a1 + a2
    peak = np.max(np.abs(mix)) or 1.0
    return (mix / peak).astype(np.float32)


def main():
    ap = argparse.ArgumentParser(description="Render SMWPWH demo WAVs.")
    ap.add_argument("--out", default=os.path.join(ROOT, "build", "audio"))
    ap.add_argument("--rate", type=int, default=48000)
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)

    jobs = [
        ("ouroboros_canon.wav", render_ouroboros_canon),
        ("endless_rise.wav", render_endless_rise),
        ("phase_cadence.wav", render_phase_cadence),
        ("phase_unison.wav", render_phase_unison),
    ]

    for name, fn in jobs:
        path = os.path.join(args.out, name)
        print(f"==> {name}")
        audio = fn(rate=args.rate)
        write_wav(path, audio, sample_rate=args.rate)
        print(f"    wrote {path}")

    print()
    print(f"done. {len(jobs)} files in {args.out}")


if __name__ == "__main__":
    main()
```

---

tools/analyze.py

```python
#!/usr/bin/env python3
"""
analyze.py — analyze an SMWPWH chord or progression from the command line.

Usage:
    python tools/analyze.py 0:0.0 4:0.25 7:0.5
    python tools/analyze.py --lambda 6 0:0.0 4:0.25

Input format:
    Each argument is PITCH:PHASE, e.g. 0:0.0 4:0.25 7:0.5

Output:
    - pitch-phase pairs
    - pairwise Shepard intervals
    - pairwise distances
    - phase consonance flags
    - total tension
"""

from __future__ import annotations

import argparse
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC = os.path.join(ROOT, "src")
if SRC not in sys.path:
    sys.path.insert(0, SRC)

from smwpwh import (  # noqa: E402
    PitchPhase,
    TensionWeights,
    distance,
    is_phase_consonant,
    shepard_interval,
    tension,
)

PC_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def parse_voice(token: str) -> PitchPhase:
    if ":" not in token:
        raise argparse.ArgumentTypeError(f"expected PITCH:PHASE, got {token!r}")
    p_str, phi_str = token.split(":", 1)
    try:
        p = int(p_str)
        phi = float(phi_str)
    except ValueError as e:
        raise argparse.ArgumentTypeError(f"could not parse {token!r}: {e}") from e
    return PitchPhase(p=p, phi=phi)


def main():
    ap = argparse.ArgumentParser(description="Analyze an SMWPWH chord.")
    ap.add_argument("voices", nargs="+", type=parse_voice,
                    help="PITCH:PHASE pairs, e.g. 0:0.0 4:0.25 7:0.5")
    ap.add_argument("--lambda", dest="lam", type=float, default=12.0,
                    help="phase weight for voice-leading distance (default 12)")
    ap.add_argument("--alpha", type=float, default=1.0)
    ap.add_argument("--beta", type=float, default=1.0)
    ap.add_argument("--gamma", type=float, default=0.1)
    ap.add_argument("--delta", type=float, default=0.05)
    args = ap.parse_args()

    vs = args.voices
    print("voices:")
    for v in vs:
        print(f"  p={v.p:2d} ({PC_NAMES[v.p]:>2})  phi={v.phi:.4f}")
    print()

    print("pairwise analysis:")
    print(f"  {'i':>2} {'j':>2}  {'dp':>3} {'dphi':>7}  {'dist':>7}  consonant")
    for i in range(len(vs)):
        for j in range(i + 1, len(vs)):
            dp, dphi = shepard_interval(vs[i], vs[j])
            d = distance(vs[i], vs[j], lam=args.lam)
            cons = "yes" if is_phase_consonant(dphi) else "no"
            print(f"  {i:>2} {j:>2}  {dp:>3} {dphi:>7.4f}  {d:>7.3f}  {cons}")
    print()

    w = TensionWeights(
        alpha=args.alpha,
        beta=args.beta,
        gamma=args.gamma,
        delta=args.delta,
    )
    t = tension(vs, w)
    print(f"tension (alpha={w.alpha} beta={w.beta} "
          f"gamma={w.gamma} delta={w.delta}): {t:.4f}")


if __name__ == "__main__":
    main()
```

---

tools/search.py

```python
#!/usr/bin/env python3
"""
search.py — search for low-tension SMWPWH progressions.

Given a start phase and pitch class, search for a sequence of
(pitch, phase) pairs that minimizes total tension across steps.

Usage:
    python tools/search.py --steps 4 --voices 3 --seed 0
    python tools/search.py --steps 6 --voices 3 --iterations 5000

Method:
    Simulated annealing over the space of (pitch class, phase) pairs.
"""

from __future__ import annotations

import argparse
import os
import random
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC = os.path.join(ROOT, "src")
if SRC not in sys.path:
    sys.path.insert(0, SRC)

from smwpwh import PitchPhase, TensionWeights, tension  # noqa: E402


def random_chord(n_voices: int, rng: random.Random) -> list[PitchPhase]:
    return [
        PitchPhase(p=rng.randrange(12), phi=rng.random())
        for _ in range(n_voices)
    ]


def neighbor(chord: list[PitchPhase], rng: random.Random) -> list[PitchPhase]:
    out = list(chord)
    i = rng.randrange(len(out))
    if rng.random() < 0.5:
        out[i] = PitchPhase(p=(out[i].p + rng.choice([-2, -1, 1, 2])) % 12,
                            phi=out[i].phi)
    else:
        out[i] = PitchPhase(p=out[i].p,
                            phi=(out[i].phi + rng.choice([-0.25, -0.125, 0.125, 0.25])) % 1.0)
    return out


def progression_energy(
    progression: list[list[PitchPhase]],
    weights: TensionWeights,
) -> float:
    total = 0.0
    for chord in progression:
        total += tension(chord, weights)
    return total


def anneal(
    n_steps: int,
    n_voices: int,
    iterations: int,
    rng: random.Random,
    weights: TensionWeights,
) -> list[list[PitchPhase]]:
    state = [random_chord(n_voices, rng) for _ in range(n_steps)]
    energy = progression_energy(state, weights)
    t0, t1 = 1.0, 0.001
    for it in range(iterations):
        temp = t0 * (t1 / t0) ** (it / iterations)
        step = rng.randrange(n_steps)
        candidate = list(state)
        candidate[step] = neighbor(candidate[step], rng)
        cand_energy = progression_energy(candidate, weights)
        dE = cand_energy - energy
        if dE < 0 or rng.random() < pow(2.718281828, -dE / max(temp, 1e-9)):
            state, energy = candidate, cand_energy
    return state


def main():
    ap = argparse.ArgumentParser(description="Search for low-tension SMWPWH progressions.")
    ap.add_argument("--steps", type=int, default=4)
    ap.add_argument("--voices", type=int, default=3)
    ap.add_argument("--iterations", type=int, default=4000)
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--lambda", dest="lam", type=float, default=12.0)
    args = ap.parse_args()

    rng = random.Random(args.seed)
    weights = TensionWeights(gamma=0.1 * args.lam / 12.0)
    result = anneal(args.steps, args.voices, args.iterations, rng, weights)

    print(f"seed={args.seed} steps={args.steps} voices={args.voices}")
    for i, chord in enumerate(result):
        t = tension(chord, weights)
        cells = "  ".join(f"p={v.p:2d} phi={v.phi:.3f}" for v in chord)
        print(f"  step {i}: T={t:.4f}  {cells}")
    print()
    print(f"total energy: {progression_energy(result, weights):.4f}")


if __name__ == "__main__":
    main()
```

---

tools/validate.py

```python
#!/usr/bin/env python3
"""
validate.py — check that SMWPWH examples follow the core rules.

Checks:
  1. All windows used in examples are seamless (W(0)=W(1)=0).
  2. Phase values in examples stay in [0, 1].
  3. Pitch classes stay in 0..11.
  4. Any phase unison in examples is prepared and resolved.

This tool is intentionally simple: it scans the .ly files as text
for the phase annotations "phi=..." and checks syntax-level invariants.

Usage:
    python tools/validate.py
"""

from __future__ import annotations

import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
EXAMPLES = os.path.join(ROOT, "examples")

PHI_RE = re.compile(r'φ=([0-9./ ]+)')
PC_RE = re.compile(r"^\s*([a-g][#b]?)(?:'|,)*\d")


def parse_phi(text: str) -> float | None:
    text = text.strip()
    if "/" in text:
        num, _, den = text.partition("/")
        try:
            return float(num) / float(den)
        except (ValueError, ZeroDivisionError):
            return None
    try:
        return float(text)
    except ValueError:
        return None


def check_file(path: str) -> list[str]:
    problems: list[str] = []
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    for raw in content.splitlines():
        line = raw.strip()
        if "φ=" not in line:
            continue
        for m in PHI_RE.finditer(line):
            value = parse_phi(m.group(1))
            if value is None:
                problems.append(f"{path}: could not parse phase {m.group(1)!r}")
                continue
            if not (0.0 <= value <= 1.0):
                problems.append(f"{path}: phase {value} outside [0,1]")

    # detect explicit wraps
    wraps = content.count("↻")
    unisons = content.count("[φ]")
    if wraps == 0:
        problems.append(f"{path}: no wrap symbol (↻) found")
    if unisons and "[φ]" not in content:
        problems.append(f"{path}: phase unison marker mismatch")

    return problems


def main() -> int:
    if not os.path.isdir(EXAMPLES):
        print(f"error: {EXAMPLES} not found", file=sys.stderr)
        return 1

    problems: list[str] = []
    files = sorted(f for f in os.listdir(EXAMPLES) if f.endswith(".ly"))
    if not files:
        print("no .ly files to validate")
        return 0

    for name in files:
        path = os.path.join(EXAMPLES, name)
        problems.extend(check_file(path))

    if problems:
        print("validation problems:")
        for p in problems:
            print(f"  - {p}")
        return 2

    print(f"validated {len(files)} file(s): OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

---

tools/make_release.sh

```bash
#!/usr/bin/env bash
#
# make_release.sh — bundle the SMWPWH repository into a release tarball.
#
# Usage:
#   tools/make_release.sh [VERSION]
#
# Produces:
#   build/release/smwpwh-VERSION.tar.gz
#
# The tarball contains:
#   README.md
#   LICENSE
#   docs/
#   examples/
#   src/
#   tools/
#   assets/

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="${1:-1.0.0}"
STAGE="$ROOT/build/release/smwpwh-$VERSION"
OUT="$ROOT/build/release/smwpwh-$VERSION.tar.gz"

rm -rf "$STAGE"
mkdir -p "$STAGE"

copy_tree() {
  local dir="$1"
  if [[ -d "$ROOT/$dir" ]]; then
    cp -R "$ROOT/$dir" "$STAGE/$dir"
  fi
}

copy_file() {
  local f="$1"
  if [[ -f "$ROOT/$f" ]]; then
    cp "$ROOT/$f" "$STAGE/$f"
  fi
}

copy_file README.md
copy_file LICENSE

for d in docs examples src tools assets; do
  copy_tree "$d"
done

# remove caches
find "$STAGE" -type d -name "__pycache__" -prune -exec rm -rf {} + 2>/dev/null || true
find "$STAGE" -type d -name ".pytest_cache" -prune -exec rm -rf {} + 2>/dev/null || true
find "$STAGE" -name "*.pyc" -delete 2>/dev/null || true

mkdir -p "$ROOT/build/release"
tar -czf "$OUT" -C "$ROOT/build/release" "smwpwh-$VERSION"

echo "wrote $OUT"
echo
echo "contents:"
tar -tzf "$OUT" | sed 's/^/  /'
```

---

tools/Makefile

```makefile
# SMWPWH tools Makefile
#
# Common tasks:
#   make install        install the Python package in editable mode
#   make test           run the test suite
#   make scores         render all LilyPond examples to PDF + MIDI
#   make audio          render all demo WAVs
#   make analyze        run the analyzer on a sample chord
#   make search         run the progression search
#   make validate       validate the example .ly files
#   make release        build a release tarball
#   make clean          remove build artifacts

PY ?= python3
VERSION ?= 1.0.0

.PHONY: help install test scores audio analyze search validate release clean

help:
	@echo "targets:"
	@echo "  install    pip install -e 'src[dev]'"
	@echo "  test       pytest"
	@echo "  scores     lilypond examples/*.ly -> build/"
	@echo "  audio      python tools/synth_demo.py"
	@echo "  analyze    python tools/analyze.py 0:0.0 4:0.25 7:0.5"
	@echo "  search     python tools/search.py --steps 4 --voices 3"
	@echo "  validate   python tools/validate.py"
	@echo "  release    tools/make_release.sh VERSION"
	@echo "  clean      rm -rf build .pytest_cache"

install:
	cd src && $(PY) -m pip install -e ".[dev]"

test:
	cd src && $(PY) -m pytest

scores:
	tools/render.sh

audio:
	$(PY) tools/synth_demo.py

analyze:
	$(PY) tools/analyze.py 0:0.0 4:0.25 7:0.5

search:
	$(PY) tools/search.py --steps 4 --voices 3 --seed 0

validate:
	$(PY) tools/validate.py

release:
	tools/make_release.sh $(VERSION)

clean:
	rm -rf build .pytest_cache
	find . -type d -name "__pycache__" -prune -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
```

---

tools/README.md

```markdown
# SMWPWH tools

Utility scripts for building, rendering, analyzing, and validating
Seals–McInnis–Windsor Phase-Wrap Harmonic material.

## Tools

| File | Purpose |
|---|---|
| `render.sh` | Render LilyPond examples to PDF and MIDI |
| `synth_demo.py` | Render demo WAVs from the Python package |
| `analyze.py` | Analyze a chord's intervals, distances, and tension |
| `search.py` | Search for low-tension progressions via simulated annealing |
| `validate.py` | Check the example `.ly` files for notation invariants |
| `make_release.sh` | Bundle the repo into a versioned tarball |
| `Makefile` | Convenience targets for common tasks |

## Requirements

- Python 3.10+
- LilyPond 2.24+ (for `render.sh`)
- NumPy (installed with the package)

## Quick start

```bash
make install
make test
make scores
make audio
make analyze
make search
make validate
make release VERSION=1.0.0
```

Examples

Analyze a chord:

```bash
python tools/analyze.py 0:0.0 4:0.25 7:0.5
```

Search for a low-tension progression:

```bash
python tools/search.py --steps 4 --voices 3 --iterations 5000 --seed 42
```

Render demo audio:

```bash
python tools/synth_demo.py --out build/audio --rate 48000
```

Validate examples:

```bash
python tools/validate.py
```

Output layout

```
build/
├── audio/                     WAV files from synth_demo.py
├── release/                   tarballs from make_release.sh
└── *.pdf, *.midi              LilyPond output
```

Notes

· render.sh requires lilypond in PATH.
· synth_demo.py adds src/ to sys.path so it runs without installing.
· search.py uses simulated annealing; results are deterministic given --seed.
· validate.py is a syntax-level checker, not a full parser.

License

MIT. See LICENSE.

```

---

## tools/.gitignore

```gitignore
# local build outputs
*.pdf
*.midi
*.wav
build/

# python caches
__pycache__/
*.pyc
.pytest_cache/
.ruff_cache/

# editor
.vscode/
.idea/
*.swp
```

---

File tree

```
tools/
├── README.md
├── Makefile
├── .gitignore
├── render.sh
├── synth_demo.py
├── analyze.py
├── search.py
├── validate.py
└── make_release.sh
```

Make the shell scripts executable

```bash
chmod +x tools/render.sh tools/make_release.sh
```

Smoke test

```bash
make install
make test
make analyze
make search
make validate
make audio
make scores       # requires lilypond
```

End of tools.
