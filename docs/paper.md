---

docs/paper.md

The Seals–McInnis–Windsor Phase-Wrap Harmonic

A Formal Theory of Cyclic Pitch-Phase Organization for Composition, Analysis, and Computation

Working paper — speculative theoretical proposal
Version 1.0

---

Abstract

The Seals–McInnis–Windsor Phase-Wrap Harmonic (SMWPWH) is a formal extension of Shepard-tone and Risset-glissando techniques into a general compositional and analytical system. It treats phase as a first-class musical dimension alongside pitch class, rhythm, and dynamics. A musical voice is represented as a pair (p, \phi), where p is a pitch class modulo 12 and \phi is a continuous phase modulo 1. The phase controls a periodic amplitude window distributed across octave-spaced components. When \phi wraps from 1 to 0, the window vanishes at the seam, allowing infinite rising or falling motion without perceptual discontinuity. SMWPWH provides notation, algebra, harmonic rules, counterpoint, formal tension metrics, orchestration practice, computational realization, and a notated example. It is intended to be usable in musical scores, performable by acoustic or electronic ensembles, and analyzable by computational methods.

Keywords: Shepard tone, Risset glissando, phase harmony, pitch-class theory, auditory illusion, counterpoint, notation, algorithmic composition.

---

1. Introduction

Traditional Western notation separates pitch, rhythm, dynamics, and timbre. It can represent rising and falling lines, but it cannot easily represent a line that continually rises yet never arrives higher. The Shepard tone achieves this illusion by layering octave-spaced sine components and applying a fixed amplitude envelope in log-frequency space. As the pitch class moves, components fade in and out, and the ear hears endless ascent or descent.

SMWPWH generalizes this illusion into a full harmonic system. Instead of treating the Shepard tone as a special effect, SMWPWH treats phase as a compositional parameter equal in importance to pitch class. A composer may write:

· a pitch-class sequence,
· a phase trajectory,
· an octave spread,
· a window function,
· a dynamic envelope,
· and an orchestration.

The result is a phase-wrapped voice: a musical line whose pitch class may rise, fall, or remain fixed while its phase determines which octaves are audible at any moment.

The theory is named after the working group that formalized it: Seals, McInnis, and Windsor. The earlier name Seals Windsor Phase-Wrap Harmony is retained in historical notes, but the present paper uses the expanded title Seals–McInnis–Windsor Phase-Wrap Harmonic.

---

2. Psychoacoustic Foundations

2.1 Chroma and height

Pitch perception has two dimensions:

1. Chroma — the circular pitch class: C, C♯, D, …, B.
2. Height — the octave register: low, middle, high.

A Shepard tone manipulates chroma while blurring height. The listener hears the chroma move, but the overall register does not seem to change.

2.2 Octave layering

A Shepard voice consists of N components separated by octaves:

f_k = f_0 \cdot 2^{k + p/12}

where p is the pitch class in semitones and k is the octave index.

2.3 Amplitude window

Each component is multiplied by a periodic window W(\phi). A common choice is the raised cosine:

W(\phi) = \sin^2(\pi \phi)

This function satisfies:

W(0) = W(1) = 0, \qquad W(1/2) = 1

As \phi moves from 0 to 1, the loudest octave shifts. When \phi wraps, the seam is masked because the edge components are silent.

2.4 Risset glissando

If \phi changes continuously rather than in discrete steps, the result is a Shepard–Risset glissando: a smooth, endless glide. SMWPWH treats both discrete and continuous phase as valid.

---

3. Basic Definitions

3.1 Pitch-class space

Let

\mathbb{Z}_{12} = \{0,1,2,\dots,11\}

represent pitch classes, where 0 = C, 1 = C♯, …, 11 = B.

3.2 Phase space

Let

\Phi = \mathbb{R}/\mathbb{Z}

represent phase. We usually write \phi \in [0,1). The value \phi=0 and \phi=1 are identical after wrapping.

3.3 Shepard voice

A Shepard voice is a tuple:

V = (p, \phi, W, N, I, D)

where:

· p \in \mathbb{Z}_{12} is the pitch class.
· \phi \in \Phi is the phase.
· W: \Phi \to [0,1] is the amplitude window.
· N is the number of octave components.
· I is the instrumentation or realization.
· D is the dynamic envelope.

3.4 Realization function

For a voice V, the amplitude of the k-th octave component is:

A_k(\phi) = D \cdot W\left( \phi + \frac{k}{N} \mod 1 \right)

The frequency of the k-th component is:

f_k = f_0 \cdot 2^{k + p/12}

The resulting signal is:

s(t) = \sum_{k=0}^{N-1} A_k(\phi(t)) \sin\left(2\pi f_k t + \theta_k\right)

where \theta_k is an optional phase offset for each component.

3.5 Phase-wrapped voice

A voice is phase-wrapped when its phase trajectory is continuous modulo 1 and the window vanishes at the seam:

\lim_{\phi \to 0^+} W(\phi) = \lim_{\phi \to 1^-} W(\phi) = 0

Under these conditions, the voice can loop indefinitely without an audible click or seam.

---

4. Notation

SMWPWH extends standard staff notation with a phase staff.

4.1 The phase staff

A second staff above the pitch staff shows \phi from 0 to 1. The phase curve may be:

· discrete — stepped phase values,
· continuous — a smooth glissando,
· cyclic — with a wrap arrow.

4.2 Symbols

Symbol Meaning
○ Shepard voice notehead
φ=0 phase at 0
↑ rising phase
↓ falling phase
↻ wrap from 1 to 0
N=4 spread across four octaves
ppp < fff > ppp Shepard fade hairpin
[φ] phase unison
// phase cadence

4.3 Example notation

```
Phase staff:  0 ──↑── 1/2 ──↑── 1 ↻ 0
Pitch staff:  C      D      E      F♯
Dynamics:     ppp <  fff >  ppp
```

This indicates a discrete Shepard scale rising from C to F♯, with the phase wrapping at the barline.

4.4 Two-voice phase canon

```
Voice 1:  p: C   D   E   F♯ | G♯ ...
          φ: 0  1/4 1/2 3/4 | 1 ↻ 0

Voice 2:  p: E   F♯ G♯ A♯ | B  ...
          φ: 1/2 3/4 1  5/4 | 3/2 ↻ 1/2
```

Voice 2 enters at phase 1/2, creating a phase canon.

---

5. Algebra of SMWPWH

5.1 The phase-wrapped group

The space of pitch-phase pairs is:

G = \mathbb{Z}_{12} \times \Phi

with addition:

(p_1, \phi_1) \oplus (p_2, \phi_2) = (p_1 + p_2 \mod 12,\; \phi_1 + \phi_2 \mod 1)

This is an abelian group.

5.2 Transposition

A transposition by n semitones and s phase units is:

T_{n,s}(p,\phi) = (p+n \mod 12,\; \phi+s \mod 1)

5.3 Inversion

Inversion is:

I(p,\phi) = (-p \mod 12,\; -\phi \mod 1)

5.4 Voice-leading distance

The distance between two voices is:

d(V_1,V_2) = \min_{k \in \mathbb{Z}} \left( |p_1 - p_2 + 12k| + \lambda |\phi_1 - \phi_2 + k| \right)

where \lambda weights the importance of phase relative to pitch class.

5.5 Shepard interval

A Shepard interval is:

(\Delta p, \Delta \phi) = (p_2 - p_1 \mod 12,\; \phi_2 - \phi_1 \mod 1)

If \Delta \phi = 0, the interval is a pure pitch-class interval. If \Delta p = 0, it is a pure phase shift.

---

6. Harmonic Rules

SMWPWH defines harmony through both pitch-class relationships and phase relationships.

6.1 Phase consonance

A phase difference is consonant when it is a simple rational fraction of the cycle:

\Delta \phi \in \left\{0, \frac{1}{2}, \frac{1}{3}, \frac{1}{4}, \frac{2}{3}, \frac{3}{4}\right\}

More generally, phase consonance is measured by the complexity of the continued fraction of \Delta \phi.

6.2 Pitch-class consonance

Traditional pitch-class consonance may be used, or the composer may define a custom interval vector.

6.3 Combined tension

A formal tension function is:

T = \alpha T_{\text{pc}} + \beta T_{\phi} + \gamma d_{\text{voice}} + \delta S_{\text{reg}}

where:

· T_{\text{pc}} = pitch-class tension,
· T_{\phi} = phase-ratio complexity,
· d_{\text{voice}} = voice-leading distance,
· S_{\text{reg}} = registral spread,
· \alpha,\beta,\gamma,\delta are weights.

6.4 Phase cadence

A phase cadence occurs when all voices converge to \phi=0 or \phi=1 and then wrap together. It creates closure without pitch-class closure.

6.5 Prohibitions and preferences

1. Do not allow two voices to share the same \phi for more than one beat unless marked phase unison.
2. Prefer contrary phase motion.
3. Resolve phase dissonance to simpler phase ratios.
4. Mask the loop seam with low amplitude.
5. Keep dynamic envelopes smooth across the wrap.

---

7. Counterpoint

SMWPWH counterpoint adds phase motion to traditional voice-leading.

7.1 Phase motion types

Type Description
Parallel Both phases rise or fall together
Contrary One rises, one falls
Oblique One moves, one holds
Similar Both move in same direction but different intervals
Phase unison Two voices share the same phase

7.2 Rules

1. Contrary phase motion is preferred.
2. Phase unisons must be prepared and resolved.
3. Parallel phase motion into a perfect phase consonance is restricted.
4. A phase cadence should be approached by stepwise phase motion.
5. The seam must be crossed by at most one voice at a time in dense textures.

7.3 Phase fugue

A phase fugue is a fugue in which the subject is a phase trajectory rather than only a pitch-class subject. The answer may enter at \phi=1/2, and the countersubject may invert the phase direction.

---

8. Form and Large-Scale Structure

8.1 Phase cycle as hypermeter

One full phase cycle 0 \to 1 can function as a hypermeasure. Multiple cycles create larger formal units.

8.2 Sectional forms

· Continuous rise — phase always rises.
· Continuous fall — phase always falls.
· Phase opposition — two groups move in opposite phase directions.
· Phase convergence — voices move toward a common phase.
· Phase divergence — voices move away from a common phase.

8.3 Cadence types

Cadence Description
Wrap cadence All voices wrap together
Half-wrap Some voices wrap, others do not
Deceptive wrap Expected wrap is delayed
Infinite cadence No wrap occurs; motion continues

---

9. Orchestration and Performance

9.1 Realization methods

SMWPWH can be realized by:

· electronic sine-wave layers,
· organ stops,
· choir,
· string harmonics,
· brass with mutes,
· woodwind choirs,
· or any ensemble capable of octave doubling and dynamic fade.

9.2 Assignment of octaves

Each octave component may be assigned to a different instrument or register. For example:

Octave Instrument
0 contrabass
1 cello
2 viola
3 violin
4 flute

9.3 Dynamic control

Performers must follow the window function W(\phi). In practice, this means:

· fade in as the phase approaches the component,
· fade out as the phase leaves it,
· never accent the seam.

9.4 Conductor cues

The conductor may follow the phase staff, a click track, or a live phase follower. In electronic performance, the phase may be automated.

---

10. Computational Realization

10.1 Pseudocode

```python
def smwpwh_voice(p, phi, N, W, duration, sample_rate):
    signal = []
    for t in range(int(duration * sample_rate)):
        phi_t = phi(t)
        s = 0
        for k in range(N):
            freq = 440 * 2 ** (k + p/12)
            amp = W((phi_t + k/N) % 1)
            s += amp * sin(2 * pi * freq * t / sample_rate)
        signal.append(s)
    return signal
```

10.2 Tension search

A composer may define a tension function and use simulated annealing or a genetic algorithm to search for phase progressions that maximize smoothness, tension, or endlessness.

10.3 MIDI limitations

Standard MIDI cannot represent continuous phase. Solutions include:

· MPE with per-note pitch bend,
· MIDI CC for dynamics,
· audio rendering,
· or custom protocols.

---

11. Example: Ouroboros Phase Canon

The following LilyPond score is a short SMWPWH study.

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

11.1 Analysis

· Voice 1 begins at \phi=0 and rises to \phi=7/8.
· Voice 2 begins at \phi=1/2 and rises to \phi=3/8 after wrapping.
· The two voices form a phase canon at the half-cycle.
· The dynamic hairpins realize the Shepard window.
· The piece loops indefinitely.

---

12. Analysis of Existing Repertoire

SMWPWH can retro-analyze existing works:

· Dunkirk — Shepard tones create relentless tension.
· Inception — rising brass and electronic layers suggest endless ascent.
· Super Mario 64 — the endless staircase uses a discrete Shepard scale.
· The Beatles, "I Am the Walrus" — ascending Shepard tone at the end.
· Franz Ferdinand, "Always Ascending" — rising Shepard glissando.

These works did not use SMWPWH notation, but the theory describes their perceptual effect.

---

13. Axioms and Theorems

Axiom 1

Phase is cyclic: \phi and \phi+1 are identical.

Axiom 2

Pitch class and phase are independent dimensions.

Axiom 3

Harmonic tension depends on both pitch-class and phase-ratio complexity.

Theorem 1

A finite sequence of Shepard voices can loop without perceptual discontinuity if and only if the phase trajectory is continuous modulo 1 and the window vanishes at the seam.

Proof sketch: If the window does not vanish, the amplitude jumps at the wrap, producing a click. If the phase is not continuous modulo 1, the pitch class jumps. If both conditions hold, the signal is periodic and seamless.

Theorem 2

The SMWPWH group G = \mathbb{Z}_{12} \times \Phi is abelian.

Proof: Addition in both components is commutative.

Theorem 3

A phase cadence can create closure without pitch-class closure.

Proof: All voices may converge to \phi=0 while retaining different pitch classes. The phase convergence is heard as resolution.

---

14. Pedagogy

Beginner

· Discrete Shepard scales.
· One voice, N=4.

Intermediate

· Two-voice phase canon.
· Phase consonance and dissonance.

Advanced

· Phase fugue.
· Continuous Risset glissando.
· Microtonal pitch classes.
· Algorithmic tension search.

Exercises

1. Write a four-bar Shepard scale that loops.
2. Write a two-voice phase canon at \phi=1/2.
3. Compose a phase cadence on \phi=0.
4. Realize a phase fugue for string quartet.

---

15. Limitations and Criticisms

· The illusion requires multiple octaves; it is weak on a single instrument.
· Notation is more complex than standard staff notation.
· Phase consonance is culturally and perceptually contingent.
· Empirical validation is needed.
· SMWPWH is an extension, not a replacement, for tonal harmony.

---

16. Future Work

· Listening tests to validate phase consonance.
· Software plugin for DAWs.
· Generalization to rhythm phase and timbre phase.
· Integration with microtonal systems.
· Automated composition using tension search.

---

17. Conclusion

The Seals–McInnis–Windsor Phase-Wrap Harmonic is a formal, notatable, performable, and computable extension of Shepard-tone and Risset-glissando techniques. It treats phase as a first-class musical dimension, providing composers with a way to write endless rising and falling lines, phase canons, phase cadences, and phase fugues. It is usable in scores, realizable by acoustic and electronic ensembles, and analyzable by computational methods. The theory is named in honor of Seals, McInnis, and Windsor, and the earlier name Seals Windsor Phase-Wrap Harmony is retained as its historical precursor.

---

Appendix A: Symbol Table

Symbol Meaning
p pitch class
\phi phase
W window function
N number of octaves
↻ wrap
↑ rising phase
↓ falling phase
○ Shepard voice notehead
// phase cadence

Appendix B: Glossary

· Chroma — pitch class.
· Phase — position within the amplitude window.
· Shepard voice — a pitch-phase pair realized across octaves.
· Phase cadence — convergence to \phi=0 or \phi=1.
· Phase fugue — a fugue organized by phase trajectories.
· Wrap — the transition from \phi=1 to \phi=0.

End of paper.



```


Copy each section into its own file:

```
docs/paper.md
docs/notation.md
docs/algebra.md
docs/counterpoint.md
```
