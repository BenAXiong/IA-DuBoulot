# Demo Nath_0410

Related: [README](../README.md) | [Founder walkthrough V1](founder_walkthrough_v1.md) | [Smoke checklist V1](smoke_checklist_v1.md) | [Student dashboard V1](student_dashboard_v1.md) | [Student workbench V1](student_workbench_v1.md) | [AI ops and economics V1](ai_ops_economics_v1.md) | [Pilot_todo](pilot_todo.md) | [MVP to-do list](mvp_todo.md)

## Purpose

This document defines the narrow demo target for Nath on `2026-04-10`.

The goal is not to show the full product. The goal is to make the student-facing conversation flow feel commercially credible on iPad, with subject creation, file upload, live chat, and homework completion working smoothly enough for a real learner demo.

## Demo Scope

Student-facing only:

- sign in
- onboarding and first-run entry if needed
- create or pick a subject
- start a homework chat
- upload or paste class content
- exchange coaching turns
- complete the homework
- show a short summary, what was covered, and a lightweight strength or knowledge trace

Explicitly out of scope for this demo:

- parent flow
- tutor flow
- admin flow
- broader billing walkthrough
- automatic completion instead of the manual `Homework done!` action

## Demo Product Rule

For this demo, banban should behave like a focused student product rather than a multi-role platform.

That means:

- student conversation mode is the only path that must feel polished
- parent or tutor entry points can be temporarily hidden, blocked, or deprioritized if that reduces confusion
- placeholder tools should not distract from the homework chat if they are not ready

## Must-Have Before Demo

### 1. Paid Gemini Production Path

- switch the deployed app to a paid Gemini project
- verify the production `GEMINI_API_KEY` points to that billed project
- rerun a live learner conversation and confirm the recent provider-fallback issue is gone or at least rare enough to trust the demo

### 2. Student-Only Demo Stability

- verify student sign-in and any required onboarding fields
- verify subject creation from the homework home
- verify first message sends immediately and receives a real reply
- improve apparent responsiveness when the first prompt is submitted so the learner feels the chat has started immediately
- show upload pills immediately when the chat initializes from the first prompt handoff
- verify file upload and pasted-image behavior
- verify the right rail behaves acceptably on a real student chat
- verify `Homework done!` produces the short learner-facing recap expected for the demo
- monitor response speed and reliability for `Fast` versus `Thinking` mode on the deployed app
- review whether the current output modes are good enough for the demo, and disable `Interactive` if the future diagram or richer guidance path is still too immature

### 3. iPad-First Polish

- run the tablet-emulation pre-pass again
- manually test the deployed app in an iPad-sized browser as closely as possible
- fix remaining sub-`44x44` tap targets or spacing traps on student routes
- check portrait and landscape layouts
- check keyboard-open behavior around the pinned composer

### 4. Student UI Polish For The Demo

- polish the recent-homework-chat list so it looks credible, readable, and tap-friendly on iPad
- keep the default avatar system playful enough for a learner demo if real avatar upload is still deferred
- localize the subject toggles so subject creation and switching do not expose mixed-language labels in the demo
- remove any remaining visual rough edges in the student shell that still read like a prototype rather than a product

### 5. Demo Narrative Tightening

- no developer wording
- no internal fallback-looking phrasing
- no confusing multi-role affordances
- no dead-end navigation around homework start or completion

### 6. Demo Commercial Posture

- decide whether the demo should expose a visible free plan at all
- decide whether the student demo account should simply run on paid access for the walkthrough
- if the free plan remains visible, make sure the quota wording is intentional and not coupled to current Gemini free-project limits
- enable the paid Gemini-backed production path before the walkthrough so live replies and extraction are not sitting on free-project risk

## Strongly Recommended

### Hide Or Neutralize Non-Student Surfaces

If time is short, prefer clarity over completeness.

Recommended options:

- hide parent/tutor/admin entry points from the demo-facing auth or shell surfaces
- if needed, keep non-student roles accessible only through direct URLs or founder use
- avoid sending Nath into a multi-role mental model during the student walkthrough

### Completion Output Polish

The completion state shown after `Homework done!` should feel like:

- a short summary
- what was covered
- a visible notion of current strength or confidence on those skills

It should not feel like:

- an operator summary
- a raw internal trace
- a pedagogy/debug dump

### Prompting Tips

Consider a small optional section in banban's answers that gives concise prompting feedback only when it is genuinely useful, for example:

- one message asks too many things at once
- the learner is pushing for the direct answer too early
- the uploaded pictures are too unclear
- the learner should say what they already tried before asking for help

### French-Expression Focus

If time allows within the student-only demo slice:

- start keeping a lightweight log of learner French expression issues across syntax, grammar, and vocabulary
- make that log usable later in the side rail and in asynchronous polishing or drilling flows
- keep the demo-facing version concise enough not to distract from the main homework chat

## If Time Allows

### Subject-Wide Library Uploads

Worth considering only if the core student demo is already stable.

Use case:

- learner uploads a textbook or reusable class document at the subject level
- later conversations can toggle it on when relevant

Constraint:

- do not design this around re-reading whole PDFs on every turn
- if touched at all before the demo, keep it extremely narrow

### Maps Tool

Stretch goal only.

Best acceptable `v0`:

- keep the sidebar entry
- allow a small aesthetic summary or diagram experience from uploaded course content
- do not widen into a second full product unless the core homework chat is already solid

## Recommended Priority Order

1. paid Gemini production switch
2. student-only live smoke on deployed app
3. iPad-critical student UI fixes
4. completion-summary polish
5. hide or neutralize non-student surfaces
6. only then, optional subject-library or Maps work

## Demo Readiness Question

The build is ready for Nath only when this sentence is true:

> A student can sign in on iPad, create or select a subject, upload or paste class material, chat with banban, finish the homework, and leave with a short useful recap, without seeing unstable multi-role product edges.
