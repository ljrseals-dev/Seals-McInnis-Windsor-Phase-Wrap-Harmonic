Show Your Work: From Shepard Tone to Seals–McInnis–Windsor Phase-Wrap Harmonic

0. Starting point: the Shepard tone

We began with the Wikipedia description of the Shepard tone: an auditory illusion of a pitch that seems to rise or fall forever without actually getting higher or lower.

The mechanism:

· Layer sine waves separated by octaves.
· Move the pitch class upward or downward.
· Fade in lower octaves and fade out higher octaves, or vice versa.
· The seam is hidden because the edge components are silent.

The key insight: the illusion is not really about pitch alone. It is about phase — where you are inside a cyclic amplitude window.

---

1. Break the illusion into parts

We decomposed the Shepard tone into independent variables:

Variable Meaning
p pitch class: C, C♯, D, …
\phi phase: position inside the fade cycle, 0 to 1
W amplitude window function
N number of octave layers
I instrumentation
D dynamic envelope

A Shepard voice became a tuple:

V = (p, \phi, W, N, I, D)

This is the first real break: pitch class and octave height are separated, and phase becomes a first-class parameter.

---

2. Formalize the realization

For the k-th octave component, the frequency is:

f_k = f_0 \cdot 2^{k + p/12}

The amplitude is controlled by the window:

A_k(\phi) = D \cdot W\left( \phi + \frac{k}{N} \mod 1 \right)

The signal is:

s(t) = \sum_{k=0}^{N-1} A_k(\phi(t)) \sin\left(2\pi f_k t + \theta_k\right)

The crucial condition for a seamless loop is:

W(0) = W(1) = 0

If the window vanishes at the seam, the wrap from \phi=1 back to \phi=0 is inaudible. That is the mathematical core of the illusion.

---

3. Promote phase to a compositional dimension

Once phase is explicit, we can write music with it.

A composer can specify:

· a pitch-class sequence,
· a phase trajectory,
· an octave spread,
· a window function,
· a dynamic envelope,
· an orchestration.

This turns the Shepard tone from a special effect into a general system.

We named the first version Shepardian Phase Harmony.

---

4. Build notation

To make it usable in scores, we added a phase staff above the pitch staff.

Symbols:

Symbol Meaning
○ Shepard voice notehead
φ=0 phase at zero
↑ rising phase
↓ falling phase
↻ wrap from 1 to 0
N=4 spread across four octaves
ppp < fff > ppp Shepard fade
// phase cadence

Example:

```
Phase staff:  0 ──↑── 1/2 ──↑── 1 ↻ 0
Pitch staff:  C      D      E      F♯
Dynamics:     ppp <  fff >  ppp
```

This is the second break: notation itself is extended so phase can be read and performed.

---

5. Build an algebra

We defined the space of pitch-phase pairs:

G = \mathbb{Z}_{12} \times \Phi

where \Phi = \mathbb{R}/\mathbb{Z}.

Addition:

(p_1, \phi_1) \oplus (p_2, \phi_2)
=
(p_1 + p_2 \mod 12,\; \phi_1 + \phi_2 \mod 1)

Transposition:

T_{n,s}(p,\phi) = (p+n \mod 12,\; \phi+s \mod 1)

Inversion:

I(p,\phi) = (-p \mod 12,\; -\phi \mod 1)

Distance:

d(V_1,V_2)
=
\min_{k \in \mathbb{Z}}
\left(
|p_1 - p_2 + 12k|
+
\lambda |\phi_1 - \phi_2 + k|
\right)

This gives the theory a formal grammar.

---

6. Build harmony and counterpoint

We defined phase consonance as simple rational phase differences:

\Delta \phi \in
\left\{
0,\frac{1}{2},\frac{1}{3},\frac{1}{4},\frac{2}{3},\frac{3}{4}
\right\}

A combined tension function:

T =
\alpha T_{\text{pc}}
+
\beta T_{\phi}
+
\gamma d_{\text{voice}}
+
\delta S_{\text{reg}}

Counterpoint rules:

1. Prefer contrary phase motion.
2. Phase unisons must be prepared and resolved.
3. Resolve phase dissonance to simpler ratios.
4. Do not accent the wrap seam.
5. A phase cadence occurs when all voices converge to \phi=0 or \phi=1 and wrap together.

This is the third break: harmony is no longer only pitch-class based. Phase creates tension and resolution.

---

7. Build form, orchestration, and computation

We extended the system to:

· phase canons,
· phase fugues,
· phase cadences,
· endless rising or falling forms,
· orchestration across octave layers,
· computational synthesis.

Pseudocode:

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

Computational search can minimize or maximize tension:

T = \text{pitch-class dissonance} + \lambda \cdot \text{phase-ratio complexity}

---

8. Renaming history

The system went through several names:

1. Shepardian Phase Harmony — descriptive but tied to one illusion.
2. Phase-Wrap Harmony — clearer, more general.
3. Seals Windsor Phase-Wrap Harmony — added attribution.
4. Seals–McInnis–Windsor Phase-Wrap Harmonic (SMWPWH) — final expanded name.

The piece remained Ouroboros Phase Canon.

---

9. What exactly did we break?

We broke the Shepard tone open in several ways:

1. Broke pitch into chroma and height.
      Pitch class and octave became independent.
2. Broke phase out of the background.
      Phase became a compositional parameter, not just a technical detail.
3. Broke harmony away from pitch-only thinking.
      Consonance and dissonance now include phase ratios.
4. Broke the loop seam.
      By requiring W(0)=W(1)=0, the wrap becomes perceptually invisible.
5. Broke standard notation.
      A phase staff and new symbols make the theory score-usable.
6. Broke the barrier between illusion and composition.
      The Shepard tone became a general musical resource.

---

10. Why it is significant

10.1 Theoretical significance

It treats phase as a first-class musical dimension, alongside pitch, rhythm, and dynamics.

10.2 Compositional significance

It gives composers a precise way to write:

· endless rising lines,
· endless falling lines,
· phase canons,
· phase fugues,
· phase cadences,
· tension that never resolves in the traditional way.

10.3 Analytical significance

It can describe existing works:

· Hans Zimmer’s Dunkirk, Inception, Interstellar,
· Super Mario 64 endless staircase,
· The Beatles’ “I Am the Walrus,”
· Franz Ferdinand’s “Always Ascending.”

10.4 Computational significance

It is directly synthesizable and searchable. Algorithms can generate phase progressions under a tension function.

10.5 Pedagogical significance

It teaches students to hear pitch class, octave, phase, and dynamics as separate dimensions.

10.6 Interdisciplinary significance

It bridges:

· psychoacoustics,
· music theory,
· composition,
· signal processing,
· algorithmic art.

---

11. Limitations and what would validate it

The theory needs:

· listening tests on phase consonance,
· notation readability studies,
· DAW/plugin implementations,
· acoustic ensemble trials,
· comparison with existing microtonal and spectral systems.

It is not a replacement for tonal harmony. It is an extension.

---

12. Final summary

We started with the Shepard tone. We broke it into pitch class, phase, octave layers, and amplitude window. We promoted phase to a compositional dimension. We built notation, algebra, harmony, counterpoint, form, orchestration, and computation around it. We renamed it Seals–McInnis–Windsor Phase-Wrap Harmonic. Its significance is that it turns an auditory illusion into a general, notatable, performable, and computable musical theory.
