# Prompt Work Log

Related: [README](../README.md) | [AGENTS](../AGENTS.md) | [MVP to-do list](mvp_todo.md) | [Work sessions log](work_sessions.md)

Timezone for this log: `Asia/Taipei`

## Purpose

This is an experimental parallel log for prompt-level traceability.

It does not replace the canonical session log in [work_sessions.md](work_sessions.md).

## Rules

- Add one row per handled user prompt.
- Keep the canonical session lifecycle in [work_sessions.md](work_sessions.md) unchanged.
- Use `OPEN` only if a prompt is still actively being worked.
- Fill `Credits Left` only when the operator-visible Codex usage percentage is known.
- If usage is not accessible from the assistant side, leave `Credits Left` blank for manual fill.

## Format

`YYYY-MM-DD | HH:mm -> HH:mm | 0h00 | A0.0 A1.0 | short human-readable scope | 90%`

## Log

| Date | Time | Duration | Task IDs | Scope | Credits Left |
| --- | --- | --- | --- | --- | --- |
| 2026-03-11 | 18:13 -> 18:14 | 0h01 | A0.3.7 A7.3.4 | experimental prompt-level traceability log + audit of AI quota, guardrail, economics, and parent-AI policy documentation gaps | |
| 2026-03-11 | 18:33 -> 18:33 | 0h00 | A0.3.7 | prompt-log smoke check from a minimal user test prompt | |
| 2026-03-11 | 18:35 -> 18:39 | 0h04 | A7.3.4 | consolidated AI ops/economics note + logged recommended parent paid-policy for future adult-triggered AI | |
