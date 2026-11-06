\version "2.24.0"

\header {
  title = "Ouroboros Phase Canon"
  subtitle = "A study in Seals–McInnis–Windsor Phase-Wrap Harmonic"
  composer = "Anonymous"
  tagline = ##f
}

%% SMWPWH Example 1: Two-voice phase canon at the half-cycle.
%%
%% Voice 1 begins at phase 0 and rises.
%% Voice 2 enters at phase 1/2 and rises.
%% Both wrap at different barlines, creating a perpetual loop.
%%
%% Realization notes:
%%  - Each notehead is a Shepard voice: sound the pitch class across
%%    several octaves (N=4 is a good default).
%%  - Dynamic hairpins realize the Shepard window W(phi).
%%  - Do not accent the wrap seam.
%%  - Repeat indefinitely.

global = {
  \time 4/4
  \tempo 4=60
}

voiceOne = \absolute {
  \global
  \override NoteHead.style = #'cross
  c'4\pp^"φ=0"
  d'4\<^"φ=1/8"
  e'4^"φ=1/4"
  fis'4^"φ=3/8"
  gis'4\f^"φ=1/2"
  ais'4\>^"φ=5/8"
  c''4^"φ=3/4"
  d''4\pp^"φ=7/8"
  \bar "||"
}

voiceTwo = \absolute {
  \global
  \override NoteHead.style = #'cross
  e'4\pp^"φ=1/2"
  fis'4\<^"φ=5/8"
  gis'4^"φ=3/4"
  ais'4^"φ=7/8"
  c''4\f^"φ=1 ↻ 0"
  d''4\>^"φ=1/8"
  e''4^"φ=1/4"
  fis''4\pp^"φ=3/8"
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
