# Pilot Operations And Learning Loop

Related: [Pilot_todo](../pilot_todo.md) | [README](../../README.md) | [AGENTS](../../AGENTS.md) | [MVP to-do list](../mvp_todo.md) | [Decision log](../decision_log.md) | [Work sessions log](../work_sessions.md)

## Purpose

Pilot operating cadence, change logs, beta exit criteria, mock-AI planning, parent verification, and trace-maintenance evidence.

This file holds long-form evidence and historical status notes. Keep the canonical task IDs and checkboxes in [Pilot_todo](../pilot_todo.md).

## Task IDs

- P4.1 - Define the weekly pilot triage cadence, evidence format, and severity language.
- P4.2 - Add a lightweight operator change log for pilot-facing fixes, regressions, and known issues.
- P4.3 - Define exit criteria for moving from Pilot to Beta, including UX, support load, and regression confidence.
- P4.4 - Add a dev-only mock-AI mode and explicit dev-versus-pilot Gemini project guidance so UI iteration does not burn pilot quota.
- P4.5 - Define how the pilot verifies or operationally trusts that a `parent` account really belongs to an adult, and when stronger checks are required before wider rollout.

## Evidence And Status Notes

Status note: `docs/pilot_todo.md` maintenance is now mandatory whenever a session changes pilot-facing polish, UX findings, release-ops assumptions, or `P*` task status, and a verified coherent slice should now also be committed and pushed in the same session. `P4` stays open because the triage cadence, operator-facing change log, Pilot-to-Beta exit criteria, and the current parent-account adulthood-verification posture are still not fully defined.
Status note: on 2026-05-31, the canonical work-session log adopted the first current-plus-archive pattern: recent/current execution rows remain in `docs/work_sessions.md`, and older closed rows move verbatim into linked files under `docs/archive/`. This closes a navigation pain point for the operating trace, but `P4.2` remains open because a broader pilot-facing change log still has not been defined.
Status note: the experimental prompt trace now uses the same current-plus-archive pattern in `docs/work_prompt_log.md`, with March-April prompt rows moved verbatim into `docs/archive/work_prompt_log_2026-03_to_2026-04.md`. `P4.2` still remains open because this is trace maintenance, not a pilot-facing operator change log.
