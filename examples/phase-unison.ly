\version "2.24.0"

\header {
  title = "Phase Unison"
  subtitle = "A study in Seals–McInnis–Windsor Phase-Wrap Harmonic"
  composer = "Anonymous"
  tagline = ##f
}

%% SMWPWH Example 5: Phase unison, prepared and resolved.
%%
%% Two voices move in contrary phase motion, meet at phi=1/2
%% (phase unison), then separate again.
%%
%% The unison is prepared (contrary approach), held briefly,
%% then resolved (contrary departure).

global = {
  \time 4/4
  \tempo 4=60
}

voiceOne = \absolute {
  \global
  \override NoteHead.style = #'cross
  c'4\pp^"φ=0"
  d'4\<^"φ=1/4"
  e'4\f^"φ=1/2 [φ]"
  f'4\>^"φ=3/4"
  g'4\pp^"φ=1 ↻ 0"
  \bar "||"
}

voiceTwo = \absolute {
  \global
  \override NoteHead.style = #'cross
  g'4\pp^"φ=1"
  f'4\<^"φ=3/4"
  e'4\f^"φ=1/2 [φ]"
  d'4\>^"φ=1/4"
  c'4\pp^"φ=0"
  \bar "||"
}

\score {
  \new StaffGroup <<
    \new Staff \with { instrumentName = "Voice 1" } \voiceOne
    \new Staff \with { instrumentName = "Voice 2" } \voiceTwo
  >>
  \layout { }
  \midi { \tempo 4=60 }
}
