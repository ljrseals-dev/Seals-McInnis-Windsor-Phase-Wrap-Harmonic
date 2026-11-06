---

docs/algebra.md

SMWPWH Algebra

Formal algebra of the Seals–McInnis–Windsor Phase-Wrap Harmonic.

---

1. Spaces

1.1 Pitch-class space

\mathbb{Z}_{12} = \{0, 1, \dots, 11\}

0 = C, 1 = C♯, …, 11 = B.

1.2 Phase space

\Phi = \mathbb{R}/\mathbb{Z}

\phi \in [0,1), with \phi=0 and \phi=1 identified.

1.3 Combined space

G = \mathbb{Z}_{12} \times \Phi

A point (p, \phi) is a phase-wrapped pitch.

---

2. Group structure

2.1 Addition

(p_1, \phi_1) \oplus (p_2, \phi_2) = (p_1 + p_2 \bmod 12,\; \phi_1 + \phi_2 \bmod 1)

2.2 Identity

e = (0, 0)

2.3 Inverse

(p, \phi)^{-1} = (-p \bmod 12,\; -\phi \bmod 1)

2.4 Abelian property

Addition commutes:

a \oplus b = b \oplus a

So G is an abelian group.

---

3. Transformations

3.1 Transposition

T_{n,s}(p,\phi) = (p+n \bmod 12,\; \phi+s \bmod 1)

n = semitones, s = phase units.

3.2 Inversion

I(p,\phi) = (-p \bmod 12,\; -\phi \bmod 1)

3.3 Phase reflection

R(p,\phi) = (p,\; 1 - \phi)

Reflects across \phi = 1/2.

3.4 Pitch reflection

P(p,\phi) = (-p \bmod 12,\; \phi)

---

4. Distance

4.1 Voice-leading distance

d(V_1,V_2) = \min_{k \in \mathbb{Z}} \left( |p_1 - p_2 + 12k| + \lambda |\phi_1 - \phi_2 + k| \right)

\lambda = phase weight.

4.2 Special cases

· \lambda = 0: distance is pure pitch-class distance.
· \lambda \to \infty: distance is pure phase distance.
· \lambda = 1: pitch and phase weighted equally.

---

5. Intervals

5.1 Shepard interval

(\Delta p, \Delta \phi) = (p_2 - p_1 \bmod 12,\; \phi_2 - \phi_1 \bmod 1)

5.2 Interpretation

\Delta p \Delta \phi Type
≠ 0 0 Pure pitch-class interval
0 ≠ 0 Pure phase shift
≠ 0 ≠ 0 Mixed interval

---

6. Consonance

6.1 Phase consonance

\Delta \phi \in \left\{ 0, \tfrac{1}{2}, \tfrac{1}{3}, \tfrac{1}{4}, \tfrac{2}{3}, \tfrac{3}{4} \right\}

6.2 Complexity measure

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



Copy each section into its own file:

```
docs/paper.md
docs/notation.md
docs/algebra.md
docs/counterpoint.md
```
