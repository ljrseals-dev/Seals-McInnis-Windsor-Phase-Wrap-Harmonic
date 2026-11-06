\version "2.24.0"

\header {
  title = "Phase Fugue"
  subtitle = "A study in Seals–McInnis–Windsor Phase-Wrap Harmonic"
  composer = "Anonymous"
  tagline = ##f
}

%% SMWPWH Example 4: Phase fugue.
%%
%% Subject: rising phase trajectory (phi 0 -> 1/2).
%% Answer: enters at phi=1/2 and rises to phi=1 ↻ 0.
%% Countersubject: falls (contrary phase motion).
%%
%% This is a short exposition only. A full fugue would continue with
%% episodes, stretto, and a phase cadence.

global = {
  \time 4/4
  \tempo 4=60
}

subject = \absolute {
  \global
  \override NoteHead.style = #'cross
  c'4\pp^"φ=0"
  d'4\<^"φ=1/8"
  e'4^"φ=1/4"
  f'4\f^"φ=3/8"
  g'4^"φ=1/2"
  \bar "||"
}

answer = \absolute {
  \global
  \override NoteHead.style = #'cross
  g'4\pp^"φ=1/2"
  a'4\<^"φ=5/8"
  b'4^"φ=3/4"
  c''4\f^"φ=7/8"
  d''4^"φ=1 ↻ 0"
  \bar "||"
}

countersubject = \absolute {
  \global
  \override NoteHead.style = #'cross
  e''4\pp^"φ=1/2"
  d''4\<^"φ=3/8"
  c''4^"φ=1/4"
  b'4\f^"φ=1/8"
  a'4^"φ=0"
  \bar "||"
}

\score {
  \new StaffGroup <<
    \new Staff \with { instrumentName = "Subject" } \subject
    \new Staff \with { instrumentName = "Answer" } \answer
    \new Staff \with { instrumentName = "Countersubject" } \countersubject
  >>
  \layout { }
  \midi { \tempo 4=60 }
}
