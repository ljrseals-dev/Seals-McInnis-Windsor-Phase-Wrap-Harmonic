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

A phase fugue is a fugue whose subject is a phase trajectory.

8.1 Subject

A phase trajectory \phi_S(t) over one or more cycles.

8.2 Answer

The answer enters at \phi = 1/2 (real answer) or at \phi = 1/2 with pitch inversion (tonal answer).

8.3 Countersubject

May invert phase direction: if subject rises, countersubject falls.

8.4 Episodes

Phase sequences derived from the subject by transposition T_{n,s}.

8.5 Stretto

Entries overlap by less than one full phase cycle.

---

9. Phase cadences

Cadence Description
Perfect phase cadence All voices converge to \phi=0
Plagal phase cadence All voices converge to \phi=1/2
Deceptive phase cadence Expected \phi=0, arrives at \phi=1/2
Half phase cadence Some voices converge, others continue
Infinite cadence No convergence; motion continues forever

---

10. Worked example: two-voice phase canon

```
Voice 1:  p: C   D   E   F♯ | G♯ ...
          φ: 0  1/4 1/2 3/4 | 1 ↻ 0

Voice 2:  p: E   F♯ G♯ A♯ | B  ...
          φ: 1/2 3/4 1  5/4 | 3/2 ↻ 1/2
```

Analysis

· Voice 2 enters at \phi = 1/2.
· Phase motion is parallel throughout.
· Pitch motion is parallel thirds.
· Wrap occurs at bar 1 for Voice 1 and at bar 2 for Voice 2.
· The canon loops indefinitely.

Improvements

· Introduce contrary phase motion in Voice 2.
· Prepare the phase unison at the cadence.
· Vary the pitch intervals to avoid parallel motion into consonance.

---

11. Summary rules

1. Prefer contrary phase motion.
2. Prepare and resolve phase unisons.
3. Avoid parallel phase motion into perfect consonance.
4. Resolve phase dissonance by step.
5. Do not accent the seam.
6. One seam crossing at a time in dense textures.
7. Phase cadences may substitute for pitch cadences.
8. Phase fugues may invert phase direction in the countersubject.

---

End of docs.

Copy each section into its own file:

```
docs/paper.md
docs/notation.md
docs/algebra.md
docs/counterpoint.md
```
