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
Status note: the 2026-08-29 focused tablet pass raised the student shell, quick-start, live composer, pricing audience selector, and minimal theme control to at least 44px targets; localized the remaining shared accessible names; and visually verified Chinese landing, oversight overlay, and pricing at `820x1180` without horizontal overflow. It also caught and fixed a fresh-request mismatch where `?lang=en` or `?lang=zh` changed visible copy while `<html lang>` stayed French. `P3.2` remains open for keyboard focus, contrast, and reduced-motion evidence across the wider route set.
