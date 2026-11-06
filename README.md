Seals–McInnis–Windsor Phase-Wrap Harmonic (SMWPWH)

Endless motion. Notatable. Performable. Computable.

A formal theory of cyclic pitch-phase organization for composition, analysis, and computation — built by breaking the Shepard tone into its constituent dimensions and promoting phase to a first-class musical parameter.

---

Table of Contents

· What is SMWPWH?
· Why it exists
· Core concepts
· Notation
· Algebra
· Harmony and counterpoint
· Orchestration
· Computational realization
· Example: Ouroboros Phase Canon
· Repository structure
· Installation and build
· Usage
· Significance
· Roadmap
· FAQ
· Nomenclature history
· License
· Citation

---

What is SMWPWH?

Seals–McInnis–Windsor Phase-Wrap Harmonic is a musical theory that treats phase — the position inside a cyclic amplitude window — as a compositional dimension equal in importance to pitch class, rhythm, and dynamics.

It generalizes the Shepard tone and the Risset glissando from isolated auditory illusions into a full system with:

· notation,
· algebra,
· harmony,
· counterpoint,
· form,
· orchestration,
· computational synthesis,
· and analysis tools.

A musical voice in SMWPWH is a pair (p, \phi), where:

· p is a pitch class modulo 12,
· \phi is a phase modulo 1.

The phase controls a periodic amplitude window distributed across octave-spaced components. When \phi wraps from 1 to 0, the window vanishes at the seam, producing endless rising or falling motion with no audible loop point.

---

Why it exists

Traditional Western notation can show a line rising or falling, but it cannot show a line that continually rises yet never arrives higher. The Shepard tone demonstrates this illusion, but existing theory treats it as a special effect.

SMWPWH does three things:

1. Decomposes the Shepard tone into independent parameters.
2. Promotes phase from a technical detail to a compositional dimension.
3. Extends notation, harmony, counterpoint, and computation to make phase-wrapped music writable, performable, and analyzable.

---

Core concepts

Shepard voice

A Shepard voice is a tuple:

V = (p, \phi, W, N, I, D)

Symbol Meaning
p pitch class \in \mathbb{Z}_{12}
\phi phase \in \mathbb{R}/\mathbb{Z}
W amplitude window function
N number of octave components
I instrumentation
D dynamic envelope

Realization

Frequency of the k-th component:

f_k = f_0 \cdot 2^{k + p/12}

Amplitude of the k-th component:

A_k(\phi) = D \cdot W\left( \phi + \frac{k}{N} \mod 1 \right)

Signal:

s(t) = \sum_{k=0}^{N-1} A_k(\phi(t)) \sin(2\pi f_k t + \theta_k)

Seam condition

For an inaudible loop:

W(0) = W(1) = 0

If the window vanishes at the seam, the wrap from \phi=1 to \phi=0 is perceptually invisible.

Common window functions

Name Formula
Raised cosine W(\phi) = \sin^2(\pi \phi)
Hann W(\phi) = \tfrac{1}{2}(1 - \cos(2\pi \phi))
Triangular \(W(\phi) = 1 - 
Custom Any W with W(0)=W(1)=0

---

Notation

SMWPWH extends standard staff notation with a phase staff above the pitch staff.

Symbols

Symbol Meaning
○ Shepard voice notehead
φ=0 phase at zero
↑ rising phase
↓ falling phase
↻ wrap from 1 to 0
N=4 spread across four octaves
ppp < fff > ppp Shepard fade hairpin
[φ] phase unison
// phase cadence

Example

```
Phase staff:  0 ──↑── 1/2 ──↑── 1 ↻ 0
Pitch staff:  C      D      E      F♯
Dynamics:     ppp <  fff >  ppp
```

Two-voice phase canon

```
Voice 1:  p: C   D   E   F♯ | G♯ ...
          φ: 0  1/4 1/2 3/4 | 1 ↻ 0

Voice 2:  p: E   F♯ G♯ A♯ | B  ...
          φ: 1/2 3/4 1  5/4 | 3/2 ↻ 1/2
```

---

Algebra

Phase-wrapped group

G = \mathbb{Z}_{12} \times \Phi, \qquad \Phi = \mathbb{R}/\mathbb{Z}

Addition:

(p_1, \phi_1) \oplus (p_2, \phi_2) = (p_1 + p_2 \bmod 12,\; \phi_1 + \phi_2 \bmod 1)

Transposition

T_{n,s}(p,\phi) = (p+n \bmod 12,\; \phi+s \bmod 1)

Inversion

I(p,\phi) = (-p \bmod 12,\; -\phi \bmod 1)

Voice-leading distance

d(V_1,V_2) = \min_{k \in \mathbb{Z}} \left( |p_1 - p_2 + 12k| + \lambda |\phi_1 - \phi_2 + k| \right)

Shepard interval

(\Delta p, \Delta \phi) = (p_2 - p_1 \bmod 12,\; \phi_2 - \phi_1 \bmod 1)

---

Harmony and counterpoint

Phase consonance

A phase difference is consonant when it is a simple rational fraction of the cycle:

\Delta \phi \in \left\{ 0, \tfrac{1}{2}, \tfrac{1}{3}, \tfrac{1}{4}, \tfrac{2}{3}, \tfrac{3}{4} \right\}

Complexity is measured by the continued fraction of \Delta \phi.

Combined tension

T = \alpha T_{\text{pc}} + \beta T_{\phi} + \gamma d_{\text{voice}} + \delta S_{\text{reg}}

Counterpoint rules

1. Prefer contrary phase motion.
2. Phase unisons must be prepared and resolved.
3. Parallel motion into a perfect phase consonance is restricted.
4. Resolve phase dissonance to simpler ratios.
5. Do not accent the wrap seam.
6. In dense textures, at most one voice crosses the seam at a time.

Phase cadence

A phase cadence occurs when all voices converge to \phi=0 or \phi=1 and wrap together. It produces closure without pitch-class closure.

Phase fugue

A fugue whose subject is a phase trajectory. The answer may enter at \phi=1/2; the countersubject may invert phase direction.

---

Orchestration

Realizable by:

· electronic sine-wave layers,
· organ stops,
· choir,
· string harmonics,
· muted brass,
· woodwind choirs,
· any ensemble with octave doubling and dynamic fade.

Octave assignment example

Octave Instrument
0 contrabass
1 cello
2 viola
3 violin
4 flute

Performance notes

· Follow the window function W(\phi).
· Fade in as phase approaches; fade out as phase leaves.
· Never accent the seam.
· Conductor may follow the phase staff, a click track, or a live phase follower.

---

Computational realization

Python pseudocode

```python
import numpy as np

def smwpwh_voice(p, phi_fn, N, W, duration, sample_rate, f0=440.0):
    n = int(duration * sample_rate)
    t = np.arange(n) / sample_rate
    signal = np.zeros(n)
    for k in range(N):
        freq = f0 * 2 ** (k + p / 12)
        amp = W((phi_fn(t) + k / N) % 1)
        signal += amp * np.sin(2 * np.pi * freq * t)
    return signal
```

Minimal example

```python
phi_fn = lambda t: (t / 4.0) % 1.0   # one cycle every 4 seconds
W = lambda phi: np.sin(np.pi * phi) ** 2
audio = smwpwh_voice(p=0, phi_fn=phi_fn, N=6, W=W,
                     duration=8.0, sample_rate=48000)
```

Tension search

Define a tension function and use simulated annealing or a genetic algorithm to search for phase progressions:

```python
def tension(progression):
    return pc_tension(progression) + lam * phase_complexity(progression)
```

MIDI limitations

Standard MIDI cannot represent continuous phase. Workarounds:

· MPE with per-note pitch bend,
· MIDI CC for dynamics,
· audio rendering,
· custom protocols.

---

Example: Ouroboros Phase Canon

```lilypond
\version "2.24.0"

\header {
  title = "Ouroboros Phase Canon"
  subtitle = "A study in Seals–McInnis–Windsor Phase-Wrap Harmonic"
  composer = "Anonymous"
  tagline = ##f
}

global = { \time 4/4 \tempo 4=60 }

voiceOne = \absolute {
  \global
  \override NoteHead.style = #'cross
  c'4\pp^"φ=0"  d'4\<^"φ=1/8"
  e'4^"φ=1/4"   fis'4^"φ=3/8"
  gis'4\f^"φ=1/2" ais'4\>^"φ=5/8"
  c''4^"φ=3/4"  d''4\pp^"φ=7/8"
  \bar "||"
}

voiceTwo = \absolute {
  \global
  \override NoteHead.style = #'cross
  e'4\pp^"φ=1/2"  fis'4\<^"φ=5/8"
  gis'4^"φ=3/4"   ais'4^"φ=7/8"
  c''4\f^"φ=1 ↻ 0" d''4\>^"φ=1/8"
  e''4^"φ=1/4"    fis''4\pp^"φ=3/8"
  \bar "||"
}

\score {
  \new StaffGroup <<
    \new Staff \with { instrumentName = "Shepard voice 1" } \voiceOne
    \new Staff \with { instrumentName = "Shepard voice 2" } \voiceTwo
  >>
  \layout { }
  \midi { \tempo 4=60 }
}
```

Analysis

· Voice 1 begins at \phi=0, rises to \phi=7/8.
· Voice 2 begins at \phi=1/2, rises to \phi=3/8 after wrapping.
· The two voices form a phase canon at the half-cycle.
· Dynamic hairpins realize the Shepard window.
· The piece loops indefinitely.

---

Repository structure

```
smwpwh/
├── README.md
├── LICENSE
├── docs/
│   ├── paper.md
│   ├── notation.md
│   ├── algebra.md
│   └── counterpoint.md
├── examples/
│   ├── ouroboros-phase-canon.ly
│   └── phase-cadence.ly
├── src/
│   ├── smwpwh/
│   │   ├── __init__.py
│   │   ├── voice.py
│   │   ├── window.py
│   │   ├── algebra.py
│   │   ├── tension.py
│   │   └── synth.py
│   └── tests/
├── assets/
│   └── smwpwh-marketing.svg
└── tools/
    └── render.sh
```

---

Installation and build

Requirements

· Python 3.10+
· NumPy
· LilyPond 2.24+ (for score rendering)
· Optional: soundfile or scipy for audio export

Install

```bash
git clone https://github.com/example/smwpwh.git
cd smwpwh
pip install -e .
```

Build the score

```bash
lilypond examples/ouroboros-phase-canon.ly
```

---

Usage

Generate a Shepard voice

```python
from smwpwh import ShepardVoice, raised_cosine

voice = ShepardVoice(
    pitch_class=0,
    phase=0.0,
    window=raised_cosine,
    octaves=6,
)
audio = voice.render(duration=8.0, sample_rate=48000, phase_rate=0.25)
```

Analyze a progression

```python
from smwpwh import tension

score = [(0, 0.0), (2, 0.25), (4, 0.5), (6, 0.75)]
print(tension(score, alpha=1.0, beta=1.5))
```

Write a phase canon

See examples/ouroboros-phase-canon.ly.

---

Significance

Theoretical

Phase becomes a first-class musical dimension alongside pitch, rhythm, and dynamics.

Compositional

Enables endless rising and falling lines, phase canons, phase fugues, and phase cadences that resolve without pitch-class closure.

Analytical

Describes existing works:

· Hans Zimmer, Dunkirk, Inception, Interstellar
· Super Mario 64 endless staircase
· The Beatles, "I Am the Walrus"
· Franz Ferdinand, "Always Ascending"

Computational

Directly synthesizable and searchable. Algorithms can generate phase progressions under a tension function.

Pedagogical

Teaches students to hear pitch class, octave, phase, and dynamics as separate dimensions.

Interdisciplinary

Bridges psychoacoustics, music theory, composition, signal processing, and algorithmic art.

---

Roadmap

· Listening tests on phase consonance
· Notation readability studies
· DAW plugin (VST3 / AU)
· Acoustic ensemble trials
· Integration with microtonal systems
· Automated composition via tension search
· Web demo with real-time phase control

---

FAQ

Q: Is this just the Shepard tone?
No. The Shepard tone is one realization. SMWPWH is a general system that uses it as a foundation.

Q: Can I play this on a piano?
Not fully. The illusion requires multiple octaves fading in and out. Piano can approximate the pitch-class sequence but not the seamless wrap.

Q: Does it replace tonal harmony?
No. It extends it. You can combine SMWPWH with tonal, modal, or atonal systems.

Q: Why the long name?
Attribution. The theory was formalized by the Seals–McInnis–Windsor working group.

Q: Is the theory validated?
It is a speculative theoretical proposal. Empirical validation is future work.

---

Nomenclature history

Version Name
v0.1 Shepardian Phase Harmony
v0.2 Phase-Wrap Harmony
v0.3 Seals Windsor Phase-Wrap Harmony
v1.0 Seals–McInnis–Windsor Phase-Wrap Harmonic (SMWPWH)

The accompanying piece is titled Ouroboros Phase Canon.

---

License

MIT License. See LICENSE.

---

Citation

```bibtex
@misc{smwpwh2025,
  title        = {Seals--McInnis--Windsor Phase-Wrap Harmonic},
  author       = {Seals, McInnis, and Windsor},
  year         = {2025},
  howpublished = {Working paper and open-source toolkit},
  note         = {Formerly Shepardian Phase Harmony; Phase-Wrap Harmony; Seals Windsor Phase-Wrap Harmony}
}
```

---

The snake eats its tail. The phase wraps. The music never arrives.
🌀
