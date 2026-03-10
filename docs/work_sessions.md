# Work Sessions Log

Related: [README](../README.md) | [AGENTS](../AGENTS.md) | [MVP to-do list](mvp_todo.md)

Timezone for this log: `Asia/Taipei`

## Rules

- Start a session row when a new work session begins.
- If the latest row is still `OPEN` and the user has not explicitly said `end session`, continue the same row.
- Close a session row only when the user explicitly says `end session`.
- Always include task IDs from [the MVP to-do list](mvp_todo.md).

## Format

`YYYY-MM-DD | HH:mm -> HH:mm | 0h00 | A0.0 A1.0 | short human-readable scope`

Use `OPEN` for the unfinished side of an active session.

## Models and Quotas

| Start | End | Quota | Model | Reasoning | Speed |
| --- | --- | --- | --- | --- | --- |
| Init | A2.1.5 | 83% | GPT-5.4 | Extra High | Fast |
| A2.1.5 | A2.2.4 | 78% | GPT-5.4 | Extra High | Fast |
| A2.2.4 | A2.3.4 | 70% | GPT-5.4 | Extra High | Fast |
| A2.3.4 | A3.2.4 | 66x% | GPT-5.4 | Extra High | Fast |
| A3.2.4 | x | xx% | GPT-5.4 | Extra High | Fast |
| x | x | xx% | GPT-5.4 | Extra High | Fast |
| x | x | xx% | GPT-5.4 | Extra High | Fast |
| x | x | xx% | GPT-5.4 | Extra High | Fast |
| x | x | xx% | GPT-5.4 | Extra High | Fast |

## Log

| Date | Time | Duration | Task IDs | Scope |
| --- | --- | --- | --- | --- |
| 2026-03-10 | 18:09 -> 18:10 | 0h01 | A0.3.1 A0.3.2 A0.3.3 A0.3.4 A0.3.5 | planning docs bootstrap from `project_brief_codex.txt` |
| 2026-03-10 | 20:05 -> OPEN | OPEN | A0.1.1 A0.1.2 A0.1.3 A0.1.4 A0.1.5 A0.2.1 A0.2.5 A0.2.6 A0.4.1 A0.4.3 A0.4.4 A1.1.1 A1.1.2 A1.1.3 A1.1.4 A1.1.5 A1.2.1 A1.2.2 A1.2.3 A1.2.4 A1.3.1 A1.3.2 A1.3.3 A1.3.4 A1.4.1 A1.4.2 A1.4.3 A2.1.1 A2.1.2 A2.1.4 A2.1.5 A2.2.1 A2.2.2 A2.2.3 A2.2.4 A2.3.1 A2.3.2 A2.3.3 A2.3.4 A3.1.1 A3.1.2 A3.1.3 A3.2.1 A3.2.2 A3.2.3 A3.2.4 A3.3.1 A3.3.2 A3.3.3 | project decisions + bootstrap + vercel + governance docs + under-13 baseline + next scaffold + hosted schema/RLS apply + backend contract docs + error/audit + storage rules + SSR auth bootstrap routes + deterministic fixture seed/RLS verification pass + sample attachment corpus + user-facing auth wiring + role-prefilled signup + profile persistence + protected-route hardening + canonical parent/tutor invitation flows + same-browser invite recovery + shared public/app shells + role-specific dashboard split + emulated iPad shell validation + live student dashboard snapshot + recent sessions/adult-link/usage status + canonical /app/new intake entry route + intake form with title/subject/file staging/pasted text/graded toggle/editable extraction review + persisted conversations/workspace/first message + return-to-session page + textual attachment references in history |
