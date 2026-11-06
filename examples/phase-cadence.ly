\version "2.24.0"

\header {
  title = "Phase Cadence"
  subtitle = "A study in Seals–McInnis–Windsor Phase-Wrap Harmonic"
  composer = "Anonymous"
  tagline = ##f
}

%% SMWPWH Example 2: Phase cadence.
%%
%% Three voices converge to phase 0 together and wrap.
%% Pitch classes do NOT converge. Closure is created by phase alone.
%%
%% Voice 1: rises from phi=1/2 to phi=1, wraps to 0.
%% Voice 2: rises from phi=1/4 to phi=1, wraps to 0.
%% Voice 3: falls from phi=1/2 to phi=0.
%%
%% All three arrive at phi=0 on the final bar. That is the phase cadence.

global = {
  \time 4/4
  \tempo 4=60
}

voiceOne = \absolute {
  \global
  \override NoteHead.style = #'cross
  g'4\pp^"φ=1/2"
  a'4\<^"φ=5/8"
  b'4^"φ=3/4"
  c''4^"φ=7/8"
  d''4\f^"φ=1 ↻ 0"
  \bar "||"
}

voiceTwo = \absolute {
  \global
  \override NoteHead.style = #'cross
  e'4\pp^"φ=1/4"
  fis'4\<^"φ=3/8"
  gis'4^"φ=1/2"
  ais'4^"φ=3/4"
  c''4\f^"φ=1 ↻ 0"
  \bar "||"
}

voiceThree = \absolute {
  \global
  \override NoteHead.style = #'cross
  c''4\pp^"φ=1/2"
  b'4\<^"φ=3/8"
  a'4^"φ=1/4"
  g'4^"φ=1/8"
  f'4\f^"φ=0 //"
  \bar "||"
}

\score {
  \new StaffGroup <<
    \new Staff \with { instrumentName = "Voice 1" } \voiceOne
    \new Staff \with { instrumentName = "Voice 2" } \voiceTwo
    \new Staff \with { instrumentName = "Voice 3" } \voiceThree
  >>
  \layout { }
  \midi { \tempo 4=60 }
}
