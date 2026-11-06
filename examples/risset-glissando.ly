\version "2.24.0"

\header {
  title = "Endless Rise"
  subtitle = "A Risset glissando in Seals–McInnis–Windsor Phase-Wrap Harmonic"
  composer = "Anonymous"
  tagline = ##f
}

%% SMWPWH Example 3: Continuous Shepard–Risset glissando.
%%
%% A single voice glides continuously upward through the phase cycle.
%% The pitch class is notated as a smooth chromatic ascent, but the
%% phase wraps so the ear never hears a destination.
%%
%% Realization: use glissando between all notes, or a continuous
%% pitch sweep across octave layers. Do not accent the wrap.

global = {
  \time 4/4
  \tempo 4=60
}

voice = \absolute {
  \global
  \override NoteHead.style = #'cross
  \override Glissando.style = #'trill

  c'4\pp^"φ=0" \glissando
  cis'4\<^"φ=1/12" \glissando
  d'4^"φ=2/12" \glissando
  dis'4^"φ=3/12" \glissando
  e'4\mf^"φ=4/12" \glissando
  f'4^"φ=5/12" \glissando
  fis'4^"φ=6/12" \glissando
  g'4\f^"φ=7/12" \glissando
  gis'4\>^"φ=8/12" \glissando
  a'4^"φ=9/12" \glissando
  ais'4^"φ=10/12" \glissando
  b'4\pp^"φ=11/12" \glissando
  c''4^"φ=1 ↻ 0"
  \bar "||"
}

\score {
  \new Staff \with { instrumentName = "Shepard voice" } \voice
  \layout { }
  \midi { \tempo 4=60 }
}
