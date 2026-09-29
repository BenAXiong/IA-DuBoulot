# Pilot Device, Accessibility, And Reliability

Related: [Pilot_todo](../pilot_todo.md) | [README](../../README.md) | [AGENTS](../../AGENTS.md) | [MVP to-do list](../mvp_todo.md) | [Decision log](../decision_log.md) | [Work sessions log](../work_sessions.md)

## Purpose

Device matrix, accessibility, tap-target, failure-recovery, and reliability evidence.

This file holds long-form evidence and historical status notes. Keep the canonical task IDs and checkboxes in [Pilot_todo](../pilot_todo.md).

## Task IDs

- P3.1 - Expand the device matrix beyond tablet emulation to cover the real pilot browser set.
- P3.2 - Run a focused accessibility pass on tap targets, focus states, contrast, and motion.
- P3.3 - Tighten empty-state, retry, and failure-recovery behavior before widening access.

## Evidence And Status Notes

Status note: real iPad Safari validation and iPad-specific keyboard or touch polish are not active Pilot gates as of 2026-05-31. They are deferred to post-pilot `P6.12`; `P3.1` should focus on the browser/device set that can actually be verified during the closed Pilot.
Status note: `P3.2` is complete for the focused Pilot pass. The 2026-08-29 work raised the student shell, reply-mode switch, quick-start, live composer, pricing audience selector, and minimal theme control to at least 44px targets; restored the shared keyboard ring on composer actions; gave borderless student textareas an explicit focus indicator; disabled brand and pending-shimmer animation under reduced motion; and raised muted-text theme tokens to at least `4.5:1` against their base backgrounds. The executable UI contract verifier covers those invariants. Chinese landing, oversight overlay, and pricing were also inspected at `820x1180` without horizontal overflow. Broader device/browser coverage remains `P3.1`, and real iPad Safari remains post-pilot `P6.12`.
Status note: the 2026-09-30 deployed student smoke exposed a completion request exceeding the harness's `90s` request budget because up to eight independent Gemini operations were serialized and SDK retries could multiply the application's own retry policy. The bounded `P3.3` fix gives generation/translation calls a `12s` provider deadline, token counts `5s`, leaves one explicit application retry owner, runs independent audience work concurrently, and preserves deterministic student-summary plus memory fallbacks. The complete local regression is green; `P3.3` remains open for broader empty-state and recovery work.
Status note: the post-fix production walkthrough passes the public localization, authenticated student, adult oversight, and French plus Chinese tablet-emulation flows. Both tablet orientations have zero horizontal overflow and all designated critical controls meet the `44px` minimum. The broader scan still identifies smaller secondary targets on dashboard subject chips, conversation copy/remove actions, and side-rail accordion labels; keep those visible as Pilot accessibility debt even though they do not fail the current critical-path gate.
