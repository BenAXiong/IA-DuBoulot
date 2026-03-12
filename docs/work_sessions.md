# Work Sessions Log

Related: [README](../README.md) | [AGENTS](../AGENTS.md) | [MVP to-do list](mvp_todo.md) | [Pilot_todo](pilot_todo.md)

Timezone for this log: `Asia/Taipei`

## Rules

- Start a session row when a new work session begins.
- If the latest row is still `OPEN` and the user has not explicitly said `end session`, continue the same row.
- Close a session row only when the user explicitly says `end session`.
- Always include task IDs from [the MVP to-do list](mvp_todo.md) or [Pilot_todo](pilot_todo.md), depending on the active work lane.

## Format

`YYYY-MM-DD | HH:mm -> HH:mm | 0h00 | A0.0 P1.0 | short human-readable scope`

Use `OPEN` for the unfinished side of an active session.

## Models and Quotas

| Start | End | Quota | Model | Reasoning | Speed | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Init | A2.1.5 | 83% | GPT-5.4 | Extra High | Fast | |
| A2.1.5 | A2.2.4 | 78% | GPT-5.4 | Extra High | Fast | |
| A2.2.4 | A2.3.4 | 70% | GPT-5.4 | Extra High | Fast | |
| A2.3.4 | A3.2.4 | 66% | GPT-5.4 | Extra High | Fast | |
| A3.2.4 | A3.5.3. | 60% | GPT-5.4 | Extra High | Fast | |
| A3.5.3 | A3.5.3 | 55% | GPT-5.4 | Extra High | Fast | codex out, lost 5% on thinking |
| A3.5.3 | A5.4.3 | 100% | GPT-5.4 | Extra High | Fast | codex quota unexpected reset |
| A5.4.3 | A6.3.3 | 100% | GPT-5.4 | Extra High | / | speed option removed ? quota not updating |
| A6.3.3 | A6.4.3 | 95% | GPT-5.4 | Extra High | / | |
| A6.4.3 | A7.2.3 | 91% | GPT-5.4 | Extra High | / | |
| A7.2.3 | A7.4.3 | 88% | GPT-5.4 | Extra High | / | |
| A7.4.3 | A2.4.3 | 83% | GPT-5.4 | Extra High | / | back to left out tasks |
| A2.4.3 | A7.1.3 | 81% | GPT-5.4 | Extra High | Fast | crash during tablet-emulation attempt; resumed on remaining external setup and device QA |
| A.x.x.x | A.x.x.x | 77% | GPT-5.4 | Extra High | / | MVP last considerations and Pilot prep |
| x | x | 100% | GPT-5.4 | Extra High | / | unexpected quota refresh again|
| x | P1.3 | 84% | GPT-5.4 | Extra High | / | |
| x | x | 79% | GPT-5.4 | Extra High | / | localization and UI revamp|
| x | x | 76% | GPT-5.4 | High | / | |
| x | x | xx% | GPT-5.4 | Extra High | / | |
| x | x | xx% | GPT-5.4 | Extra High | / | |

## Log

| Date | Time | Duration | Task IDs | Scope |
| --- | --- | --- | --- | --- |
| 2026-03-10 | 18:09 -> 18:10 | 0h01 | A0.3.1 A0.3.2 A0.3.3 A0.3.4 A0.3.5 | planning docs bootstrap from `project_brief_codex.txt` |
| 2026-03-10 | 20:05 -> 04:10 | 8h05 | A0.1.1 A0.1.2 A0.1.3 A0.1.4 A0.1.5 A0.2.1 A0.2.5 A0.2.6 A0.4.1 A0.4.3 A0.4.4 A1.1.1 A1.1.2 A1.1.3 A1.1.4 A1.1.5 A1.2.1 A1.2.2 A1.2.3 A1.2.4 A1.3.1 A1.3.2 A1.3.3 A1.3.4 A1.4.1 A1.4.2 A1.4.3 A2.1.1 A2.1.2 A2.1.4 A2.1.5 A2.2.1 A2.2.2 A2.2.3 A2.2.4 A2.3.1 A2.3.2 A2.3.3 A2.3.4 A3.1.1 A3.1.2 A3.1.3 A3.2.1 A3.2.2 A3.2.3 A3.2.4 A3.3.1 A3.3.2 A3.3.3 A3.4.1 A3.4.2 A3.4.3 A3.4.4 A3.5.1 A3.5.2 A3.5.3 | project decisions + bootstrap + vercel + governance docs + under-13 baseline + next scaffold + hosted schema/RLS apply + backend contract docs + error/audit + storage rules + SSR auth bootstrap routes + deterministic fixture seed/RLS verification pass + sample attachment corpus + user-facing auth wiring + role-prefilled signup + profile persistence + protected-route hardening + canonical parent/tutor invitation flows + same-browser invite recovery + shared public/app shells + role-specific dashboard split + emulated iPad shell validation + live student dashboard snapshot + recent sessions/adult-link/usage status + canonical /app/new intake entry route + intake form with title/subject/file staging/pasted text/graded toggle/editable extraction review + persisted conversations/workspace/first message + return-to-session page + textual attachment references in history + student workbench with persisted transcript/workspace mutations + deterministic hint/summarize replies + upload-reference control + emulated iPad conversation validation + canonical /app/history route + session completion endpoint + deterministic student summary persistence + targeted history/complete/detail smoke pass |
| 2026-03-11 | 10:52 -> 12:53 | 2h01 | A4.1.1 A4.1.2 A4.1.3 A4.2.1 A4.2.2 A4.2.3 A4.2.4 A4.3.1 A4.3.2 A4.3.3 A4.3.4 A4.4.1 A4.4.2 A4.4.3 A4.4.4 A4.5.1 A4.5.2 A4.5.3 A4.5.4 A5.1.1 A5.1.2 A5.1.3 A5.2.1 A5.2.2 A5.2.3 A5.3.1 A5.3.2 A5.3.3 A5.3.4 A5.4.1 A5.4.2 A5.4.3 A7.2.2 | phase A4 stability closure + parent/tutor/admin oversight surfaces + tutor-note routes and audit feed + adult oversight smoke coverage + full Phase 4/5 traceability reconciliation |
| 2026-03-11 | 13:48 -> 19:09 | 5h21 | A0.2.4 A0.3.6 A0.3.7 A0.4.2 A2.1.3 A2.1.5 A2.1.6 A2.4.1 A2.4.2 A2.4.3 A6.1.1 A6.1.2 A6.1.3 A6.1.4 A6.2.1 A6.2.2 A6.2.3 A6.3.1 A6.3.2 A6.3.3 A6.4.1 A6.4.2 A6.4.3 A7.2.1 A7.2.3 A7.3.1 A7.3.2 A7.3.3 A7.3.4 A7.4.1 A7.4.2 A7.4.3 | phase A6 context rebuild + usage counters, trial/quota enforcement, billing abstraction, deployed Lemon test-mode verification, privacy/settings deletion controls, student memory profile work, repo-owned A0/A2 foundation closure for fallback-provider choice + UI primitives + i18n + telemetry/feature flags + GitHub workflow artifacts, QA smoke/regression checklist closure, A7.3 cost-control guardrails with artifact reuse + upload-economics review, A7.4 launch-candidate docs with PWA deferral + founder walkthrough, and an experimental prompt-level log plus AI ops/policy gap audit |
| 2026-03-11 | 21:35 -> 21:52 | 0h17 | A0.2.2 A0.2.3 A0.3.6 A7.1.1 A7.1.2 A7.1.3 | close remaining external setup gaps where possible, walk through GitHub labels, and run a Chrome or Playwright tablet-emulation pass ahead of real iPad Safari validation |
| 2026-03-11 | 23:20 -> 04:12 | 4h52 | A0.2.2 A0.2.3 A0.3.6 A0.3.7 A2.1.3 A2.1.5 A7.1.1 A7.1.2 A7.1.3 A7.4.4 A7.4.5 A7.4.6 A7.4.7 A7.4.8 P1.1 P1.2 P1.3 | fresh context rebuild after crash, traceability reconciliation, Resend and GitHub-label follow-up, trilingual UI or accent audit, pilot-plan split, shared shell branding polish, and the first full light or dark theme redesign pass |
| 2026-03-12 | 09:42 -> 12:59 | 3h17 | A0.3.2 A0.3.6 A0.3.7 A7.4.4 A7.4.5 A7.4.6 A7.4.7 P1.1 P1.2 P1.3 P4.1 P4.2 | tighten pilot or workflow traceability, finish the remaining localization slice, redesign the public landing through multiple calmer product-facing iterations, document the role-test workflow, refresh the affected checks, and publish verified slices |
| 2026-03-12 | 16:02 -> OPEN | OPEN | A0.3.7 A7.4.7 P1.1 P1.2 P1.3 | continue landing polish, reopen the public-shell decisions around motion and chrome, and answer the current product questions around minors, interaction modes, and cursor behavior |
