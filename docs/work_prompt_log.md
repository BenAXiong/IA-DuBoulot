# Prompt Work Log

Related: [README](../README.md) | [AGENTS](../AGENTS.md) | [MVP to-do list](mvp_todo.md) | [Pilot_todo](pilot_todo.md) | [Work sessions log](work_sessions.md)

Timezone for this log: `Asia/Taipei`

## Purpose

This is an experimental parallel log for prompt-level traceability.

It does not replace the canonical session log in [work_sessions.md](work_sessions.md).

It is still a manual repo artifact: it cannot auto-start itself at instance boot, so a row only exists once the assistant has opened and patched this file during the session.

## Rules

- Add one row per handled user prompt.
- Keep the canonical session lifecycle in [work_sessions.md](work_sessions.md) unchanged.
- Use `OPEN` only if a prompt is still actively being worked.
- Fill `Credits Left` only when the operator-visible Codex usage percentage is known.
- If usage is not accessible from the assistant side, leave `Credits Left` blank for manual fill.
- Use `A*` task IDs for MVP work and `P*` task IDs for pilot-hardening work when that separate lane is active.

## Format

`YYYY-MM-DD | HH:mm -> HH:mm | 0h00 | A0.0 P1.0 | short human-readable scope | 90%`

## Log

| Date | Time | Duration | Task IDs | Scope | Credits Left |
| --- | --- | --- | --- | --- | --- |
| 2026-03-11 | 18:13 -> 18:14 | 0h01 | A0.3.7 A7.3.4 | experimental prompt-level traceability log + audit of AI quota, guardrail, economics, and parent-AI policy documentation gaps | |
| 2026-03-11 | 18:33 -> 18:33 | 0h00 | A0.3.7 | prompt-log smoke check from a minimal user test prompt | |
| 2026-03-11 | 18:35 -> 18:39 | 0h04 | A7.3.4 | consolidated AI ops/economics note + logged recommended parent paid-policy for future adult-triggered AI | |
| 2026-03-11 | 18:40 -> 19:09 | 0h29 | A0.2.4 A0.3.6 A2.1.3 A2.1.5 A2.1.6 A2.4.1 A2.4.2 A2.4.3 | close repo-owned remaining A0/A2 tasks through fallback-provider decision, UI/i18n foundations, telemetry/feature flags, GitHub workflow artifacts, and external-blocker prep | |
| 2026-03-11 | 21:35 -> 21:52 | 0h17 | A0.2.2 A0.2.3 A0.3.6 A7.1.1 A7.1.2 A7.1.3 | verify new PostHog and Resend setup state, explain GitHub label creation, and run a tablet-emulation QA pass before real iPad Safari testing | |
| 2026-03-11 | 23:20 -> 23:55 | 0h35 | A0.2.2 A0.2.3 A0.3.6 A0.3.7 A2.1.3 A2.1.5 A7.1.1 A7.1.2 A7.1.3 A7.4.4 A7.4.5 A7.4.6 | rebuild project context after crash, reconcile traceability, and audit resend, GitHub labels, plus trilingual UI or accent support | |
| 2026-03-11 | 23:55 -> 00:23 | 0h28 | A0.2.3 A0.3.6 A0.3.7 | verify no-domain Resend path, install `gh`, and sync the remote GitHub labels | |
| 2026-03-12 | 00:23 -> 00:41 | 0h18 | A0.3.6 A0.3.7 A7.4.4 A7.4.7 A7.4.8 | close GitHub label sync, explain prompt-log limits, create `Pilot_todo`, and add shared branding polish to the global shells | |
| 2026-03-12 | 00:50 -> 00:51 | 0h01 | A7.4.4 A7.4.5 A7.4.6 P1.1 P2.1 | prioritize the next non-blocked MVP and Pilot slices after excluding Resend and real iPad dependency work | |
| 2026-03-12 | 00:54 -> 01:31 | 0h37 | A7.4.4 A7.4.5 A7.4.6 | continue the shared trilingual UI-copy pass across public, auth, onboarding, invite, app-shell, and settings surfaces, then verify and reconcile the related docs | |
| 2026-03-12 | 01:40 -> 02:02 | 0h22 | A7.4.4 A7.4.5 A7.4.6 P5.1 | continue the deeper dashboard localization slice, add Pilot structural-audit coverage, and answer Gemini rate-limit mitigation questions | |
| 2026-03-12 | 02:03 -> 02:55 | 0h52 | A0.2.4 A7.3.4 A7.4.4 A7.4.5 A7.4.6 P4.4 | localize the remaining intake, history, workbench, linked-student-detail, and adult-review routes, then document Gemini project-limit planning and pilot quota mitigations | |
| 2026-03-12 | 02:56 -> 03:10 | 0h14 | A7.1.2 A7.4.4 A7.4.5 A7.4.6 | localize the admin audit plus privacy and quota feedback surfaces, add explicit CJK font fallback, refresh the tablet-emulation selectors, rerun verification, and reconcile the docs | |
| 2026-03-12 | 03:11 -> 03:18 | 0h07 | A7.1.2 A7.4.6 | extend the tablet-emulation smoke to switch the fixture UI language, run the local zh tablet pre-pass, and reconcile the remaining blocker notes | |
| 2026-03-12 | 03:19 -> 03:43 | 0h24 | A7.1.2 A7.4.4 A7.4.5 A7.4.6 | localize the remaining core student server-side errors and deterministic fallback text, humanize weakness-tag chips, rerun verification plus localized tablet smoke, and reconcile the MVP docs | |
| 2026-03-12 | 03:44 -> 04:06 | 0h22 | P1.1 P1.2 P1.3 A7.1.2 | redesign the shared light and dark theme system across shells, cards, buttons, inputs, and auth surfaces, add a persisted theme toggle plus dark-mode tablet smoke support, rerun verification, and reconcile the docs | |
| 2026-03-12 | 04:11 -> 04:12 | 0h01 | A0.3.7 | close the active work session after the shared theme redesign slice and sync the parallel prompt trace | |
| 2026-03-12 | 09:42 -> 10:28 | 0h46 | A0.3.2 A0.3.6 A0.3.7 A7.4.4 A7.4.5 A7.4.6 P4.1 P4.2 | tighten pilot or workflow traceability, make commit or push expectations repo rules, answer local versus deployed verification expectations, finish the remaining auth or invite or tutor-note or memory or billing localization slice, refresh the affected smokes, and publish the verified work | |
| 2026-03-12 | 10:29 -> 10:58 | 0h29 | A0.3.7 A7.4.7 P1.1 P1.2 P1.3 | redesign the landing into a real product-facing page, tuck repo or operator links into a floating helper button, propose concise copy alternatives, and document how to test the role flows | |
| 2026-03-12 | 10:59 -> 12:00 | 1h01 | A7.4.7 P1.1 P1.2 P1.3 | iterate on the landing and public shell again with a hover language menu, slimmer header, English-first hero copy, new product sections, and an explanation of the local-versus-deployed mismatch | |
| 2026-03-12 | 12:01 -> 12:16 | 0h15 | A7.4.7 P1.1 P1.2 P1.3 | add a multi-theme customizer to the landing floater with hover-preview presets, a saved custom token editor, and the related theme-foundation updates | |
| 2026-03-12 | 12:35 -> 12:42 | 0h07 | A7.4.7 P1.1 P1.2 P1.3 | widen the landing canvas, standardize the preview rows into alternating `1 preview + 3 glass cards` sections, and tighten the floater or language-menu interactions | |
| 2026-03-12 | 12:43 -> 12:59 | 0h16 | A7.4.7 P1.1 P1.2 P1.3 | replace the landing preview blocks with locally hosted public-source abstract GIF placeholders, narrow the cards column further, and rerun verification | |
| 2026-03-12 | 16:02 -> 16:09 | 0h07 | A0.3.7 A7.4.7 P1.1 P1.2 P1.3 | close the previous session at 12:59, reopen a new landing-polish session, equalize the GIF rows, simplify the top bar, add slow CTA motion, and answer the current product questions | |
| 2026-03-12 | 16:37 -> 16:40 | 0h03 | A0.3.7 A7.4.7 P1.1 P1.2 P1.3 P2.4 P4.5 | close the 16:02 session at 16:09, reopen a new one, speed up CTA drift, fix alternating media-versus-cards widths, expand section spacing, and log the subject-mode plus parent-verification pilot follow-ups | |
| 2026-03-12 | 16:40 -> 16:49 | 0h09 | A0.3.7 A7.4.7 P1.1 P1.2 P1.3 | correct the landing section rhythm so all three rows share the same gif or cards footprint and only section 2 reverses the layout | |
| 2026-03-13 | 10:17 -> 10:18 | 0h01 | A0.3.7 | close the 2026-03-12 16:37 session at 16:49, reopen a new session for today, and audit whether the repo already has a canonical list of pages | |
| 2026-03-13 | 10:18 -> 10:36 | 0h18 | A0.3.7 | fix the clipped public language dropdown by removing header-shell overflow clipping and summarize how to avoid this common agent debugging snag | |
| 2026-03-13 | 10:36 -> 10:56 | 0h20 | A0.3.7 | anchor the language dropdown above the trigger, add a faint global commit marker in the top-left corner, and verify whether the build hash can auto-refresh on each push | |
| 2026-03-13 | 10:56 -> 11:04 | 0h08 | A0.3.7 | restore the language dropdown below the trigger and fix the real clipping bug by adding an explicit overflow-allowing shell variant instead of relying on a losing utility override | |
| 2026-03-13 | 11:04 -> 11:18 | 0h14 | A0.3.7 | add a hover-close grace period to the language dropdown and harden the active-item contrast so the highlighted language stays readable | |
