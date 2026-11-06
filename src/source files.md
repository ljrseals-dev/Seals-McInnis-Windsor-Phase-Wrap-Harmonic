src/ — Seals–McInnis–Windsor Phase-Wrap Harmonic

Printable source files for the SMWPWH Python package. Copy each into its own file under src/.

---

src/pyproject.toml

```toml
[build-system]
requires = ["setuptools>=68", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "smwpwh"
version = "1.0.0"
description = "Seals–McInnis–Windsor Phase-Wrap Harmonic: composition, analysis, and synthesis"
readme = "README.md"
requires-python = ">=3.10"
license = { text = "MIT" }
authors = [
  { name = "Seals, McInnis, and Windsor" }
]
keywords = ["music-theory", "shepard-tone", "phase", "synthesis", "algorithmic-composition"]
dependencies = [
  "numpy>=1.24",
]

[project.optional-dependencies]
audio = ["soundfile>=0.12", "scipy>=1.10"]
dev = ["pytest>=7.0", "ruff>=0.1"]

[tool.setuptools.packages.find]
where = ["."]

[tool.pytest.ini_options]
testpaths = ["tests"]

[tool.ruff]
line-length = 100
target-version = "py310"
```

---

src/smwpwh/init.py

```python
"""
Seals–McInnis–Windsor Phase-Wrap Harmonic (SMWPWH).

A formal theory of cyclic pitch-phase organization for composition,
analysis, and computation.

Public API
----------
ShepardVoice         : a (pitch class, phase, window, octaves) voice
Windows              : amplitude window functions
Algebra              : group operations on (p, phi)
Tension              : harmonic tension metrics
Synth                : signal rendering
"""

from .voice import ShepardVoice
from .window import (
    raised_cosine,
    hann,
    triangular,
    rectangular,
    Window,
    WINDOWS,
)
from .algebra import (
    PitchPhase,
    add,
    transpose,
    invert,
    phase_reflect,
    pitch_reflect,
    distance,
    shepard_interval,
    phase_complexity,
    is_phase_consonant,
    PHASE_CONSONANCES,
)
from .tension import (
    pitch_class_tension,
    phase_tension,
    registral_spread,
    tension,
    TensionWeights,
)
from .synth import render_voice, write_wav

__version__ = "1.0.0"

__all__ = [
    # voice
    "ShepardVoice",
    # windows
    "raised_cosine",
    "hann",
    "triangular",
    "rectangular",
    "Window",
    "WINDOWS",
    # algebra
    "PitchPhase",
    "add",
    "transpose",
    "invert",
    "phase_reflect",
    "pitch_reflect",
    "distance",
    "shepard_interval",
    "phase_complexity",
    "is_phase_consonant",
    "PHASE_CONSONANCES",
    # tension
    "pitch_class_tension",
    "phase_tension",
    "registral_spread",
    "tension",
    "TensionWeights",
    # synth
    "render_voice",
    "write_wav",
]
```

---

src/smwpwh/window.py

```python
"""
Amplitude window functions for SMWPWH.

Every window must satisfy W(0) = W(1) = 0 so that the wrap seam
from phi=1 to phi=0 is inaudible. The rectangular window is provided
for experimentation and deliberately violates this condition.
"""

from __future__ import annotations

import numpy as np
from typing import Callable

Window = Callable[[np.ndarray], np.ndarray]


def raised_cosine(phi: np.ndarray) -> np.ndarray:
    """W(phi) = sin^2(pi * phi). Default SMWPWH window."""
    phi = np.asarray(phi, dtype=float)
    return np.sin(np.pi * phi) ** 2


def hann(phi: np.ndarray) -> np.ndarray:
    """W(phi) = 0.5 * (1 - cos(2 pi phi))."""
    phi = np.asarray(phi, dtype=float)
    return 0.5 * (1.0 - np.cos(2.0 * np.pi * phi))


def triangular(phi: np.ndarray) -> np.ndarray:
    """W(phi) = 1 - |2 phi - 1|. Non-smooth but valid."""
    phi = np.asarray(phi, dtype=float)
    return 1.0 - np.abs(2.0 * phi - 1.0)


def rectangular(phi: np.ndarray) -> np.ndarray:
    """
    W(phi) = 1 everywhere. NOT seamless; provided for experiments.
    Do not use for looping material.
    """
    phi = np.asarray(phi, dtype=float)
    return np.ones_like(phi)


WINDOWS: dict[str, Window] = {
    "raised_cosine": raised_cosine,
    "hann": hann,
    "triangular": triangular,
    "rectangular": rectangular,
}


def is_seamless(window: Window, tol: float = 1e-6) -> bool:
    """Return True if the window vanishes at phi=0 and phi=1."""
    edge = np.array([0.0, 1.0])
    return bool(np.all(np.abs(window(edge)) < tol))
```

---

src/smwpwh/voice.py

```python
"""
The Shepard voice: a pitch-phase pair realized across octave layers.

    V = (p, phi, W, N, I, D)

See the SMWPWH paper, section 3.3.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable, Optional

import numpy as np

from .window import Window, raised_cosine


@dataclass
class ShepardVoice:
    """
    A Shepard voice.

    Parameters
    ----------
    pitch_class : int
        Pitch class in Z_12. 0 = C, 1 = C#, ..., 11 = B.
    phase : float
        Phase in [0, 1). Wraps modulo 1.
    window : Window
        Amplitude window function W(phi).
    octaves : int
        Number of octave components N.
    f0 : float
        Base frequency in Hz for octave 0.
    label : str
        Optional name for the voice (for scores).
    """

    pitch_class: int
    phase: float = 0.0
    window: Window = raised_cosine
    octaves: int = 6
    f0: float = 440.0
    label: str = ""

    def __post_init__(self) -> None:
        self.pitch_class = int(self.pitch_class) % 12
        self.phase = float(self.phase) % 1.0
        if self.octaves < 1:
            raise ValueError("octaves must be >= 1")

    # --- pitch / phase -----------------------------------------------------

    def transpose(self, semitones: int, phase_units: float = 0.0) -> "ShepardVoice":
        """Return a new voice transposed by semitones and phase_units."""
        return ShepardVoice(
            pitch_class=(self.pitch_class + int(semitones)) % 12,
            phase=(self.phase + float(phase_units)) % 1.0,
            window=self.window,
            octaves=self.octaves,
            f0=self.f0,
            label=self.label,
        )

    def invert(self) -> "ShepardVoice":
        """Return the pitch-phase inversion of this voice."""
        return ShepardVoice(
            pitch_class=(-self.pitch_class) % 12,
            phase=(-self.phase) % 1.0,
            window=self.window,
            octaves=self.octaves,
            f0=self.f0,
            label=self.label,
        )

    # --- component amplitudes ---------------------------------------------

    def amplitudes(self, phi: Optional[float] = None) -> np.ndarray:
        """
        Amplitudes A_k(phi) for k = 0..N-1.

        A_k(phi) = W( (phi + k/N) mod 1 )
        """
        phi = self.phase if phi is None else float(phi) % 1.0
        k = np.arange(self.octaves)
        arg = (phi + k / self.octaves) % 1.0
        return self.window(arg)

    def frequencies(self) -> np.ndarray:
        """
        Component frequencies f_k = f0 * 2^(k + p/12).
        """
        k = np.arange(self.octaves)
        return self.f0 * 2.0 ** (k + self.pitch_class / 12.0)

    # --- convenience -------------------------------------------------------

    def at_phase(self, phi: float) -> "ShepardVoice":
        """Return a copy of this voice with a new phase."""
        return ShepardVoice(
            pitch_class=self.pitch_class,
            phase=float(phi) % 1.0,
            window=self.window,
            octaves=self.octaves,
            f0=self.f0,
            label=self.label,
        )

    def __repr__(self) -> str:
        name = f" {self.label!r}" if self.label else ""
        return (
            f"<ShepardVoice{name} p={self.pitch_class} "
            f"phi={self.phase:.3f} N={self.octaves}>"
        )


def voice_trajectory(
    voice: ShepardVoice,
    phase_fn: Callable[[float], float],
    duration: float,
    sample_rate: int,
) -> tuple[np.ndarray, np.ndarray]:
    """
    Return (t, phi(t)) arrays for a phase trajectory.

    Parameters
    ----------
    voice : ShepardVoice
        Used only for sample_rate consistency and defaults.
    phase_fn : callable
        Map from time in seconds to phase in [0, 1).
    duration : float
        Seconds.
    sample_rate : int
        Samples per second.
    """
    n = int(round(duration * sample_rate))
    t = np.arange(n) / sample_rate
    phi = np.mod(np.asarray([phase_fn(ti) for ti in t], dtype=float), 1.0)
    return t, phi
```

---

src/smwpwh/algebra.py

```python
"""
Algebra of the phase-wrapped group G = Z_12 x Phi.

See the SMWPWH paper, section 5.
"""

from __future__ import annotations

from dataclasses import dataclass
from fractions import Fraction
from math import gcd
from typing import Iterable

PHASE_CONSONANCES: tuple[Fraction, ...] = (
    Fraction(0, 1),
    Fraction(1, 2),
    Fraction(1, 3),
    Fraction(1, 4),
    Fraction(2, 3),
    Fraction(3, 4),
)


@dataclass(frozen=True)
class PitchPhase:
    """An element (p, phi) of G = Z_12 x Phi."""

    p: int
    phi: float

    def __post_init__(self) -> None:
        object.__setattr__(self, "p", int(self.p) % 12)
        object.__setattr__(self, "phi", float(self.phi) % 1.0)

    def __add__(self, other: "PitchPhase") -> "PitchPhase":
        return PitchPhase(self.p + other.p, self.phi + other.phi)

    def __neg__(self) -> "PitchPhase":
        return PitchPhase(-self.p, -self.phi)

    def __sub__(self, other: "PitchPhase") -> "PitchPhase":
        return self + (-other)

    def __repr__(self) -> str:
        return f"PitchPhase(p={self.p}, phi={self.phi:.4f})"


def add(a: PitchPhase, b: PitchPhase) -> PitchPhase:
    return a + b


def transpose(x: PitchPhase, n: int, s: float) -> PitchPhase:
    """T_{n,s}(p, phi) = (p + n mod 12, phi + s mod 1)."""
    return PitchPhase(x.p + n, x.phi + s)


def invert(x: PitchPhase) -> PitchPhase:
    """I(p, phi) = (-p mod 12, -phi mod 1)."""
    return PitchPhase(-x.p, -x.phi)


def phase_reflect(x: PitchPhase) -> PitchPhase:
    """R(p, phi) = (p, 1 - phi). Reflection across phi = 1/2."""
    return PitchPhase(x.p, 1.0 - x.phi)


def pitch_reflect(x: PitchPhase) -> PitchPhase:
    """P(p, phi) = (-p mod 12, phi)."""
    return PitchPhase(-x.p, x.phi)


def distance(
    a: PitchPhase,
    b: PitchPhase,
    lam: float = 12.0,
    k_range: int = 8,
) -> float:
    """
    Voice-leading distance:

        d = min_k ( |p1 - p2 + 12k| + lam * |phi1 - phi2 + k| )

    lam weights pitch-class vs phase distance.
    k_range limits the integer search.
    """
    best = float("inf")
    for k in range(-k_range, k_range + 1):
        pc = abs(a.p - b.p + 12 * k)
        ph = abs(a.phi - b.phi + k)
        d = pc + lam * ph
        if d < best:
            best = d
    return best


def shepard_interval(a: PitchPhase, b: PitchPhase) -> tuple[int, float]:
    """Return (delta_p mod 12, delta_phi mod 1)."""
    dp = (b.p - a.p) % 12
    dphi = (b.phi - a.phi) % 1.0
    return dp, dphi


# --- phase consonance -----------------------------------------------------

def _to_fraction(x: float, max_denominator: int = 64) -> Fraction:
    return Fraction(x).limit_denominator(max_denominator)


def phase_complexity(delta_phi: float, max_denominator: int = 64) -> int:
    """
    Sum of continued-fraction coefficients of delta_phi.

    Lower = simpler = more consonant.
    """
    f = _to_fraction(delta_phi, max_denominator)
    n, d = f.numerator, f.denominator
    if d == 0:
        return 0
    # continued fraction expansion
    coeffs: list[int] = []
    while d:
        a = n // d
        coeffs.append(abs(a))
        n, d = d, n - a * d
    return int(sum(coeffs))


def is_phase_consonant(delta_phi: float, tol: float = 1e-9) -> bool:
    """True if delta_phi is one of the simple phase consonances."""
    for c in PHASE_CONSONANCES:
        if abs(float(c) - delta_phi) < tol:
            return True
    return False


# --- group sanity ---------------------------------------------------------

def is_abelian(samples: Iterable[PitchPhase]) -> bool:
    """Sanity check: verify a + b == b + a for a small sample."""
    xs = list(samples)
    for i, a in enumerate(xs):
        for b in xs[i:]:
            if a + b != b + a:
                return False
    return True
```

---

src/smwpwh/tension.py

```python
"""
Harmonic tension metrics for SMWPWH.

    T = alpha * T_pc + beta * T_phi + gamma * d_voice + delta * S_reg

See the SMWPWH paper, section 6.3.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Sequence

import numpy as np

from .algebra import PitchPhase, distance, phase_complexity

# Rough tonal consonance ranking for pitch-class intervals (0-11).
# Values are heuristic; replace with an interval vector for rigorous work.
_PC_TENSION: dict[int, float] = {
    0: 0.0,   # unison / octave
    7: 0.1,   # perfect fifth
    5: 0.1,   # perfect fourth
    4: 0.2,   # major third
    3: 0.2,   # minor third
    9: 0.3,   # major sixth
    8: 0.3,   # minor sixth
    2: 0.5,   # major second
    10: 0.5,  # minor seventh
    1: 0.8,   # minor second
    11: 0.8,  # major seventh
    6: 0.9,   # tritone
}


@dataclass
class TensionWeights:
    alpha: float = 1.0   # pitch-class tension
    beta: float = 1.0    # phase tension
    gamma: float = 0.1   # voice-leading distance
    delta: float = 0.05  # registral spread


def pitch_class_tension(p1: int, p2: int) -> float:
    """Heuristic pitch-class tension between two pitch classes."""
    interval = (int(p2) - int(p1)) % 12
    return _PC_TENSION.get(interval, 0.5)


def phase_tension(phi1: float, phi2: float) -> float:
    """Tension from phase-ratio complexity, normalized to [0, 1]."""
    delta = abs((phi2 - phi1) % 1.0)
    c = phase_complexity(delta)
    # Empirical normalization; scale so c=1 -> 0, c>=16 -> 1.
    return float(min(1.0, max(0.0, (c - 1) / 15.0)))


def registral_spread(voices: Sequence[PitchPhase]) -> float:
    """Spread of pitch classes across the chord, normalized to [0, 1]."""
    if len(voices) < 2:
        return 0.0
    ps = np.array([v.p for v in voices], dtype=float)
    return float((ps.max() - ps.min()) / 11.0)


def tension(
    voices: Iterable[PitchPhase],
    weights: TensionWeights | None = None,
) -> float:
    """
    Total tension for a chord (set of voices).

    T = alpha * mean_pc + beta * mean_phase + gamma * mean_distance
        + delta * spread
    """
    w = weights or TensionWeights()
    vs = list(voices)
    if len(vs) < 2:
        return 0.0

    pc_terms: list[float] = []
    ph_terms: list[float] = []
    d_terms: list[float] = []

    for i in range(len(vs)):
        for j in range(i + 1, len(vs)):
            pc_terms.append(pitch_class_tension(vs[i].p, vs[j].p))
            ph_terms.append(phase_tension(vs[i].phi, vs[j].phi))
            d_terms.append(distance(vs[i], vs[j]))

    mean_pc = float(np.mean(pc_terms)) if pc_terms else 0.0
    mean_ph = float(np.mean(ph_terms)) if ph_terms else 0.0
    mean_d = float(np.mean(d_terms)) if d_terms else 0.0
    spread = registral_spread(vs)

    return float(
        w.alpha * mean_pc
        + w.beta * mean_ph
        + w.gamma * mean_d
        + w.delta * spread
    )
```

---

src/smwpwh/synth.py

```python
"""
Signal rendering for SMWPWH voices.

    s(t) = sum_k A_k(phi(t)) * sin(2 pi f_k t + theta_k)
"""

from __future__ import annotations

import wave
from typing import Callable, Optional

import numpy as np

from .voice import ShepardVoice


def render_voice(
    voice: ShepardVoice,
    duration: float,
    sample_rate: int = 48000,
    phase_fn: Optional[Callable[[np.ndarray], np.ndarray]] = None,
    phase_rate: float = 0.25,
    fade_seconds: float = 0.01,
) -> np.ndarray:
    """
    Render a Shepard voice to a mono float array in [-1, 1].

    Parameters
    ----------
    voice : ShepardVoice
        Voice definition. Its own phase is used as the starting offset.
    duration : float
        Duration in seconds.
    sample_rate : int
        Samples per second.
    phase_fn : callable or None
        If provided, called with time array t (seconds), returns phi array.
        If None, uses linear phase: phi(t) = voice.phase + phase_rate * t.
    phase_rate : float
        Cycles per second when phase_fn is None.
    fade_seconds : float
        Linear fade applied at start and end to avoid clicks on playback.
    """
    n = int(round(duration * sample_rate))
    t = np.arange(n) / sample_rate

    if phase_fn is None:
        phi = (voice.phase + phase_rate * t) % 1.0
    else:
        phi = np.mod(np.asarray(phase_fn(t), dtype=float), 1.0)

    freqs = voice.frequencies()
    signal = np.zeros(n, dtype=float)

    for k, f in enumerate(freqs):
        # Amplitude envelope A_k(phi) = W( (phi + k/N) mod 1 )
        arg = (phi + k / voice.octaves) % 1.0
        amp = voice.window(arg)
        signal += amp * np.sin(2.0 * np.pi * f * t)

    # Normalize
    peak = np.max(np.abs(signal))
    if peak > 0:
        signal /= peak

    # Fade in / out to avoid boundary clicks
    if fade_seconds > 0:
        m = min(int(fade_seconds * sample_rate), n // 2)
        if m > 0:
            ramp = np.linspace(0.0, 1.0, m)
            signal[:m] *= ramp
            signal[-m:] *= ramp[::-1]

    return signal.astype(np.float32)


def write_wav(path: str, signal: np.ndarray, sample_rate: int = 48000) -> None:
    """Write a mono float array to a 16-bit PCM WAV file."""
    clipped = np.clip(signal, -1.0, 1.0)
    pcm = (clipped * 32767.0).astype(np.int16)
    with wave.open(path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(pcm.tobytes())


def render_chord(
    voices: list[ShepardVoice],
    duration: float,
    sample_rate: int = 48000,
    phase_rate: float = 0.25,
) -> np.ndarray:
    """Render several voices together and normalize."""
    n = int(round(duration * sample_rate))
    out = np.zeros(n, dtype=float)
    for v in voices:
        out += render_voice(v, duration, sample_rate, phase_rate=phase_rate, fade_seconds=0.0)
    peak = np.max(np.abs(out))
    if peak > 0:
        out /= peak
    return out.astype(np.float32)


if __name__ == "__main__":
    # Smoke test: write a short WAV of the default voice.
    v = ShepardVoice(pitch_class=0, phase=0.0, octaves=6)
    audio = render_voice(v, duration=8.0, phase_rate=0.25)
    write_wav("smwpwh_demo.wav", audio)
    print("wrote smwpwh_demo.wav")
```

---

src/tests/test_window.py

```python
import numpy as np

from smwpwh.window import (
    hann,
    is_seamless,
    raised_cosine,
    rectangular,
    triangular,
)


def test_seamless_windows():
    assert is_seamless(raised_cosine)
    assert is_seamless(hann)
    assert is_seamless(triangular)


def test_rectangular_is_not_seamless():
    assert not is_seamless(rectangular)


def test_raised_cosine_peak():
    phi = np.array([0.5])
    assert np.isclose(raised_cosine(phi)[0], 1.0)
```

---

src/tests/test_voice.py

```python
import numpy as np
import pytest

from smwpwh.voice import ShepardVoice
from smwpwh.window import raised_cosine


def test_pitch_class_wraps():
    v = ShepardVoice(pitch_class=14, phase=0.0)
    assert v.pitch_class == 2


def test_phase_wraps():
    v = ShepardVoice(pitch_class=0, phase=1.25)
    assert np.isclose(v.phase, 0.25)


def test_amplitudes_shape():
    v = ShepardVoice(pitch_class=0, phase=0.0, octaves=6)
    a = v.amplitudes()
    assert a.shape == (6,)


def test_frequencies_octave_spacing():
    v = ShepardVoice(pitch_class=0, phase=0.0, octaves=4, f0=440.0)
    f = v.frequencies()
    assert np.isclose(f[0], 440.0)
    assert np.isclose(f[1], 880.0)
    assert np.isclose(f[2], 1760.0)


def test_transpose_returns_new_voice():
    v = ShepardVoice(pitch_class=0, phase=0.0)
    w = v.transpose(3, 0.25)
    assert w.pitch_class == 3
    assert np.isclose(w.phase, 0.25)
    assert v.pitch_class == 0  # original untouched


def test_invert_roundtrip():
    v = ShepardVoice(pitch_class=4, phase=0.3)
    w = v.invert().invert()
    assert w.pitch_class == v.pitch_class
    assert np.isclose(w.phase, v.phase)


def test_octaves_must_be_positive():
    with pytest.raises(ValueError):
        ShepardVoice(pitch_class=0, octaves=0)
```

---

src/tests/test_algebra.py

```python
import numpy as np
from fractions import Fraction

from smwpwh.algebra import (
    PitchPhase,
    add,
    distance,
    invert,
    is_abelian,
    is_phase_consonant,
    phase_complexity,
    phase_reflect,
    pitch_reflect,
    shepard_interval,
    transpose,
)


def test_pitch_phase_wraps():
    x = PitchPhase(p=14, phi=1.25)
    assert x.p == 2
    assert np.isclose(x.phi, 0.25)


def test_addition_commutes():
    a = PitchPhase(3, 0.25)
    b = PitchPhase(7, 0.5)
    assert a + b == b + a


def test_addition_matches_add_function():
    a = PitchPhase(3, 0.25)
    b = PitchPhase(7, 0.5)
    assert add(a, b) == a + b


def test_transpose():
    x = PitchPhase(0, 0.0)
    y = transpose(x, 5, 0.25)
    assert y.p == 5
    assert np.isclose(y.phi, 0.25)


def test_invert_roundtrip():
    x = PitchPhase(4, 0.3)
    assert invert(invert(x)) == x


def test_phase_reflect():
    x = PitchPhase(4, 0.3)
    y = phase_reflect(x)
    assert y.p == 4
    assert np.isclose(y.phi, 0.7)


def test_pitch_reflect():
    x = PitchPhase(4, 0.3)
    y = pitch_reflect(x)
    assert y.p == 8
    assert np.isclose(y.phi, 0.3)


def test_distance_symmetric():
    a = PitchPhase(0, 0.0)
    b = PitchPhase(4, 0.25)
    assert np.isclose(distance(a, b), distance(b, a))


def test_distance_self_zero():
    a = PitchPhase(5, 0.5)
    assert np.isclose(distance(a, a), 0.0)


def test_shepard_interval():
    a = PitchPhase(0, 0.0)
    b = PitchPhase(4, 0.25)
    dp, dphi = shepard_interval(a, b)
    assert dp == 4
    assert np.isclose(dphi, 0.25)


def test_phase_complexity_simple_ratios():
    assert phase_complexity(0.0) == 0
    assert phase_complexity(1.0) == 0
    # 1/4 has a short continued fraction
    assert phase_complexity(0.25) <= 5


def test_is_phase_consonant():
    assert is_phase_consonant(0.0)
    assert is_phase_consonant(0.5)
    assert is_phase_consonant(1.0 / 3.0)
    assert not is_phase_consonant(0.37)


def test_is_abelian_sample():
    sample = [PitchPhase(0, 0.0), PitchPhase(3, 0.25), PitchPhase(7, 0.5)]
    assert is_abelian(sample)
```

---

src/tests/test_tension.py

```python
import numpy as np

from smwpwh.algebra import PitchPhase
from smwpwh.tension import (
    TensionWeights,
    phase_tension,
    pitch_class_tension,
    registral_spread,
    tension,
)


def test_pitch_class_tension_unison_zero():
    assert pitch_class_tension(0, 0) == 0.0


def test_pitch_class_tension_fifth_low():
    assert pitch_class_tension(0, 7) < pitch_class_tension(0, 6)


def test_phase_tension_unison_zero():
    assert np.isclose(phase_tension(0.0, 0.0), 0.0)


def test_phase_tension_increases_with_complexity():
    t_simple = phase_tension(0.0, 0.5)
    t_complex = phase_tension(0.0, 0.37)
    assert t_simple < t_complex


def test_registral_spread_single_voice_zero():
    assert registral_spread([PitchPhase(0, 0.0)]) == 0.0


def test_registral_spread_full_range():
    voices = [PitchPhase(0, 0.0), PitchPhase(11, 0.5)]
    assert np.isclose(registral_spread(voices), 1.0)


def test_tension_returns_float():
    voices = [PitchPhase(0, 0.0), PitchPhase(7, 0.0)]
    t = tension(voices)
    assert isinstance(t, float)
    assert t >= 0.0


def test_tension_zero_for_single_voice():
    assert tension([PitchPhase(0, 0.0)]) == 0.0


def test_tension_weights_can_zero_components():
    voices = [PitchPhase(0, 0.0), PitchPhase(6, 0.37)]
    w = TensionWeights(alpha=0.0, beta=0.0, gamma=0.0, delta=0.0)
    assert tension(voices, w) == 0.0


def test_tension_increases_with_dissonance():
    consonant = [PitchPhase(0, 0.0), PitchPhase(7, 0.0)]
    dissonant = [PitchPhase(0, 0.0), PitchPhase(6, 0.37)]
    assert tension(consonant) < tension(dissonant)
```

---

src/tests/test_synth.py

```python
import numpy as np
import os
import tempfile

from smwpwh.synth import render_chord, render_voice, write_wav
from smwpwh.voice import ShepardVoice


def test_render_voice_shape():
    v = ShepardVoice(pitch_class=0, phase=0.0, octaves=4)
    audio = render_voice(v, duration=1.0, sample_rate=8000)
    assert audio.shape == (8000,)


def test_render_voice_in_range():
    v = ShepardVoice(pitch_class=0, phase=0.0, octaves=4)
    audio = render_voice(v, duration=1.0, sample_rate=8000)
    assert np.max(np.abs(audio)) <= 1.0 + 1e-6


def test_render_voice_with_phase_fn():
    v = ShepardVoice(pitch_class=0, phase=0.0, octaves=4)
    audio = render_voice(
        v,
        duration=1.0,
        sample_rate=8000,
        phase_fn=lambda t: (0.5 * t) % 1.0,
    )
    assert audio.shape == (8000,)


def test_render_chord_normalizes():
    vs = [
        ShepardVoice(0, 0.0, octaves=4),
        ShepardVoice(4, 0.25, octaves=4),
    ]
    audio = render_chord(vs, duration=0.5, sample_rate=8000)
    assert np.max(np.abs(audio)) <= 1.0 + 1e-6
    assert np.max(np.abs(audio)) > 0.0


def test_write_wav_creates_file():
    v = ShepardVoice(pitch_class=0, phase=0.0, octaves=4)
    audio = render_voice(v, duration=0.2, sample_rate=8000)
    with tempfile.TemporaryDirectory() as d:
        path = os.path.join(d, "test.wav")
        write_wav(path, audio, sample_rate=8000)
        assert os.path.exists(path)
        assert os.path.getsize(path) > 44  # more than the WAV header
```

---

src/tests/init.py

```python
# Test package for SMWPWH.
```

---

src/README.md

```markdown
# SMWPWH source

Python implementation of the Seals–McInnis–Windsor Phase-Wrap Harmonic.

## Install

```bash
pip install -e ".[dev]"
```

Quick start

```python
from smwpwh import ShepardVoice, render_voice, write_wav

v = ShepardVoice(pitch_class=0, phase=0.0, octaves=6)
audio = render_voice(v, duration=8.0, phase_rate=0.25)
write_wav("endless_rise.wav", audio)
```

Run tests

```bash
pytest
```

Modules

Module Purpose
window.py Amplitude window functions W(phi)
voice.py Shepard voice dataclass and helpers
algebra.py Group operations on (p, phi)
tension.py Harmonic tension metrics
synth.py Signal rendering and WAV output

Design notes

· All windows must satisfy W(0) = W(1) = 0 for seamless loops.
  rectangular is provided only for experiments.
· Phase is always stored modulo 1. Pitch class is always modulo 12.
· Voice-leading distance uses an integer search over octave wraps;
  increase k_range for very large intervals.
· Tension weights are heuristic. Replace _PC_TENSION with a proper
  interval vector for rigorous analysis.

Citation

```bibtex
@misc{smwpwh2025,
  title  = {Seals--McInnis--Windsor Phase-Wrap Harmonic},
  author = {Seals, McInnis, and Windsor},
  year   = {2025},
  note   = {Working paper and open-source toolkit}
}
```

```

---

## File tree

```

src/
├── pyproject.toml
├── README.md
├── smwpwh/
│   ├── init.py
│   ├── window.py
│   ├── voice.py
│   ├── algebra.py
│   ├── tension.py
│   └── synth.py
└── tests/
├── init.py
├── test_window.py
├── test_voice.py
├── test_algebra.py
├── test_tension.py
└── test_synth.py

```

**Smoke test**

```bash
cd src
pip install -e ".[dev]"
pytest
python -m smwpwh.synth
# writes smwpwh_demo.wav
```

End of src.
