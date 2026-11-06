---

docs/notation.md

SMWPWH Notation Reference

Complete notation guide for writing Seals–McInnis–Windsor Phase-Wrap Harmonic scores.

---

1. Overview

SMWPWH scores use two staves:

1. Phase staff (top) — shows \phi from 0 to 1.
2. Pitch staff (bottom) — shows pitch class using circular noteheads.

Dynamics, hairpins, and performance instructions appear between or below the staves.

---

2. The phase staff

2.1 Range

The phase staff spans \phi = 0 at the bottom to \phi = 1 at the top. The value \phi=1 is identical to \phi=0 after wrapping.

2.2 Grid

Optional horizontal lines at \phi = 0, 1/4, 1/2, 3/4, 1.

2.3 Discrete phase

Stepped line segments, one per note:

```
φ: 0 ── 1/4 ── 1/2 ── 3/4 ── 1 ↻ 0
```

2.4 Continuous phase

A smooth curve or glissando line:

```
φ: 0 ╱╱╱╱╱╱╱╱ 1 ↻ 0
```

2.5 Wrap arrow

The symbol ↻ marks a wrap from \phi=1 to \phi=0.

---

3. The pitch staff

3.1 Noteheads

Notehead Meaning
○ (circle) Shepard voice
● (filled) Ordinary pitch
◐ (half-filled) Shepard voice with fixed phase

3.2 Octave spread

N=4 means the pitch class is sounded across four octaves. The window W(\phi) determines which octave is loudest.

3.3 Pitch-class accidentals

Standard accidentals apply. Microtonal variants may use arrows: ↑ for quarter-sharp, ↓ for quarter-flat.

---

4. Dynamics

4.1 Shepard fade hairpin

```
ppp < fff > ppp
```

This is the standard Shepard envelope. It rises to a peak and returns to silence.

4.2 Forced fade

! before a dynamic means the fade is mandatory regardless of window position.

4.3 Window override

W: followed by a function name overrides the default window.

Example:

```
W: triangular
```

---

5. Phase cadence

The symbol // marks a phase cadence: all voices converge to \phi=0 or \phi=1 and wrap together.

```
Voice 1: φ 0 ── 1/4 ── 1/2 ── 3/4 ── 1 ↻ 0 //
Voice 2: φ 1/2 ── 3/4 ── 1 ── 5/4 ── 3/2 ↻ 1/2 //
```

---

6. Phase unison

[φ] marks a phase unison: two or more voices share the same phase. Must be prepared and resolved.

---

7. Full example

```
Phase staff:   0 ──↑── 1/2 ──↑── 1 ↻ 0
Pitch staff:   ○C     ○D     ○E     ○F♯
Dynamics:      ppp <  fff >  ppp
Octave spread: N=4    N=4    N=4    N=4
```

---

8. Performance instructions

· Follow the window function.
· Do not accent the wrap.
· Fade smoothly across the seam.
· In dense textures, only one voice crosses the seam at a time.
· Conductor follows the phase staff or a click track.

---

9. Quick symbol table

Symbol Meaning
○ Shepard voice notehead
φ=0 phase at zero
↑ rising phase
↓ falling phase
↻ wrap
N=4 octave spread
ppp < fff > ppp Shepard fade
[φ] phase unison
// phase cadence
W: window override
! forced fade


For general \Delta \phi, use the continued fraction:

\Delta \phi = [a_0; a_1, a_2, \dots]

Complexity:

C(\Delta \phi) = \sum_i a_i

Lower C = more consonant.

6.3 Combined consonance

K = \alpha K_{\text{pc}} + \beta K_{\phi}

---

7. Tension

7.1 General form

T = \alpha T_{\text{pc}} + \beta T_{\phi} + \gamma d_{\text{voice}} + \delta S_{\text{reg}}

7.2 Component definitions

· T_{\text{pc}}: pitch-class tension (e.g., interval vector).
· T_{\phi}: phase-ratio complexity C(\Delta \phi).
· d_{\text{voice}}: voice-leading distance.
· S_{\text{reg}}: registral spread.

7.3 Weights

\alpha, \beta, \gamma, \delta \geq 0. Set to zero to disable a component.

---

8. Theorems

Theorem 1 (Seamless loop)

A finite sequence of Shepard voices loops without perceptual discontinuity iff:

1. \phi(t) is continuous modulo 1, and
2. W(0) = W(1) = 0.

Theorem 2 (Abelian group)

G = \mathbb{Z}_{12} \times \Phi is abelian.

Theorem 3 (Phase closure)

A phase cadence produces closure without pitch-class closure.

Theorem 4 (Transposition invariance)

T_{n,s} preserves voice-leading distance:

d(T_{n,s}(V_1), T_{n,s}(V_2)) = d(V_1, V_2)

Theorem 5 (Inversion preserves consonance)

I preserves phase consonance classes.

---

9. Worked example

Voices:

V_1 = (0, 0.0), \quad V_2 = (4, 0.25)

Shepard interval:

(\Delta p, \Delta \phi) = (4, 0.25)

Phase complexity:

0.25 = \tfrac{1}{4} \Rightarrow C = 4

Voice-leading distance (\lambda = 12):

d = \min_k \left( |0-4+12k| + 12 |0 - 0.25 + k| \right)

For k = 0:

d = 4 + 12(0.25) = 4 + 3 = 7

For k = -1:

d = |0-4-12| + 12 |-0.25 - 1| = 16 + 15 = 31

So d = 7.

---

docs/counterpoint.md

SMWPWH Counterpoint

Rules and techniques for phase-based counterpoint in the Seals–McInnis–Windsor Phase-Wrap Harmonic.

---

1. Principles

Traditional counterpoint governs pitch motion between voices. SMWPWH counterpoint governs both pitch and phase motion. A voice is a trajectory in G = \mathbb{Z}_{12} \times \Phi.

---

2. Phase motion types

Type Description Symbol
Parallel Both phases rise or fall together ⇈ ⇊
Contrary One rises, one falls ⇅
Oblique One moves, one holds ⇉
Similar Both move same direction, different intervals ⇈'
Phase unison Same phase [φ]

---

3. First species (note against note)

1. Begin and end on phase consonance.
2. Prefer contrary phase motion.
3. Avoid phase unisons except at cadences.
4. Do not cross the seam in more than one voice at a time.

Example

```
Voice 1: φ 0.00 ── 0.25 ── 0.50 ── 0.75
Voice 2: φ 0.50 ── 0.25 ── 0.00 ── 0.75
Motion:  ⇅      ⇅      ⇅      ⇉
```

---

4. Second species (two against one)

1. Phase may move by step in the faster voice.
2. The slower voice should hold or move by simple ratio.
3. Phase dissonance on the strong beat must resolve by step.

---

5. Third species (four against one)

1. Phase may move freely in the faster voice.
2. Avoid parallel phase motion into perfect consonance.
3. The seam may be crossed by the faster voice only.

---

6. Fourth species (suspensions)

A phase suspension occurs when a voice holds its phase while another moves.

Types:

Type Description
4–3 Phase held, then resolves down by 1/4
7–6 Phase held, then resolves down by 1/3
9–8 Phase held, then resolves down by 1/2

---

7. Fifth species (florid)

Free combination of the above. Governed by the general rules:

1. Prefer contrary phase motion.
2. Prepare and resolve phase unisons.
3. Resolve phase dissonance to simpler ratios.
4. Do not accent the seam.
5. In dense textures, at most one voice crosses the seam at a time.

---

8. Phase fugue



Copy each section into its own file:

```
docs/paper.md
docs/notation.md
docs/algebra.md
docs/counterpoint.md
```
