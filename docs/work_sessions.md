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
| x | x | 70% | GPT-5.4 | High | / | |
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
| 2026-03-12 | 16:02 -> 16:09 | 0h07 | A0.3.7 A7.4.7 P1.1 P1.2 P1.3 | continue landing polish, reopen the public-shell decisions around motion and chrome, and answer the current product questions around minors, interaction modes, and cursor behavior |
| 2026-03-12 | 16:37 -> 16:49 | 0h12 | A0.3.7 A7.4.7 P1.1 P1.2 P1.3 P2.4 P4.5 | continue landing polish again, clarify subject-specific conversation planning, and define the parent-account adulthood-verification follow-up for pilot operations |
| 2026-03-13 | 10:17 -> 11:36 | 1h19 | A0.3.7 | restart after the 2026-03-12 landing-polish thread, reconcile the session boundary, and audit whether a canonical page inventory already exists |
| 2026-03-13 | 12:27 -> 12:56 | 0h29 | A0.3.7 A7.4.7 P1.1 P1.3 | reopen after the auth viewport-fit pass, shrink `/auth` into a compact HUD-style entry, tighten the auth cards, and align placeholder copy with public-facing product suggestions |
| 2026-03-13 | 15:25 -> 15:46 | 0h21 | A0.3.7 A7.4.7 P1.1 P1.3 | restart after the auth copy cleanup, switch the site theme to hidden system-default behavior, and refine `/app` so the authenticated surfaces read like product UI instead of pilot scaffolding |
| 2026-03-18 | 11:35 -> 13:30 | 1h55 | A0.3.7 A7.4.4 A7.4.6 A7.4.7 P1.1 P1.3 | reopen the execution trace for today after canceling the unused 2026-03-17 session opening, then complete the French accent audit, restore a simple light-or-dark plus language utility cluster across the public and authenticated shell headers, and tighten the authenticated language-switch responsiveness |
| 2026-03-18 | 13:30 -> 13:53 | 0h23 | P1.1 P1.3 P2.2 | continue with the parent `/app` redesign, replace the placeholder parent dashboard with a calmer learner-first oversight workspace, reconcile the billing smoke, and close the documentation loop |
| 2026-03-21 | 15:13 -> 15:31 | 0h18 | A0.3.7 P5.1 | cancel the unused 2026-03-19 19:20 session opening, resync the execution trace for that day, and run the first structural hotspot audit to rank the repo's most urgent refactor targets |
| 2026-03-23 | 11:30 -> 11:35 | 0h05 | A7.3.4 P2.4 | explain the current AI instruction layering, confirm which prompt families are actually implemented, and clarify the planned future forks for subject-specific coaching and adult-triggered AI |
| 2026-04-01 | 17:39 -> 18:23 | 0h44 | A0.3.7 | reopen the execution trace for today, close the stale 2026-03-21 session at 15:31, preserve the 2026-03-23 prompt-only slice as a canonical session row, and resync the logs before the next implementation slice |
| 2026-04-02 | 10:50 -> 12:37 | 1h47 | A0.3.7 P2.2 P2.5 P1.3 | close the 2026-04-01 session at 18:23, reopen the trace for today, add parent-side pending approval requests, extend the redesigned parent dashboard with an additive parent-created learner bootstrap path while keeping the learner-created flow intact, and repair the missing Gemini production env on Vercel |
| 2026-04-02 | 16:33 -> 16:35 | 0h02 | A0.3.7 | close the earlier 2026-04-02 session at 12:37 and reopen a fresh execution trace for the next slice |
| 2026-04-04 | 10:22 -> 14:02 | 3h40 | A0.3.7 P1.1 P1.3 P2.1 P2.4 | reopen the execution trace for today, then redesign the student `/app` shell into a chat-first learner workspace, move learner-owned support controls into settings, simplify the intake and conversation surfaces, and log the deferred subject-model or implicit-creation decisions for Pilot |
| 2026-04-04 | 15:58 -> 18:31 | 2h33 | A0.3.7 P1.3 P2.1 P2.4 P2.6 | continue the afternoon student-flow pass by trimming onboarding, retiring `/app/new`, unblocking first-homework launch, tightening the learner shell and quick-start copy, adding the placeholder Forward mode, and simplifying the live conversation rail plus attachment controls through the first-homework fix |
| 2026-04-04 | 20:14 -> 21:56 | 1h42 | A0.3.7 P1.3 P2.1 P2.4 P2.6 | resume the evening student-flow pass to document the remaining zero-history smoke gap, tighten the homework copy and first-subject selector, stop the stray Netlify/tooling drift, refine the live conversation rail and title behavior, log the learner-interest pilot idea, and restore a clearer new-subject path in the homework rail |
| 2026-04-06 | 13:11 -> 17:54 | 4h43 | A0.3.7 P1.3 P2.1 P2.4 P2.7 P4.4 P5.3 A0.2.1 A7.3.4 | continue the student shell and live-chat polish, log Pilot tuning ideas, tighten the homework and conversation workflow, add prompt governance infrastructure, and investigate plus instrument Gemini provider fallback failures in production |
| 2026-04-08 | 13:14 -> 17:55 | 4h41 | A0.3.7 | reopen the execution trace for today after closing the prior 2026-04-06 session at 17:54 and resync the logs before the next implementation slice |
| 2026-04-09 | 15:40 -> 17:09 | 1h29 | A0.3.7 | close the prior 2026-04-08 session at 17:55, reopen the trace for today, and keep the execution logs synced through the next implementation slice |
| 2026-04-10 | 10:42 -> 12:22 | 1h40 | A0.3.7 | close the prior 2026-04-09 session at 17:09 and reopen a fresh execution trace for today before the next slice |
| 2026-04-10 | 14:32 -> 16:24 | 1h52 | A0.3.7 | close the earlier 2026-04-10 session at 12:22 and reopen a fresh execution trace for the next implementation slice |
| 2026-04-17 | 13:59 -> 17:15 | 3h16 | A0.3.7 | close the stale 2026-04-10 open session at 16:24, reopen a fresh execution trace for the day, and keep the logs synced through the student AI-reliability and shell-polish slices |
| 2026-04-20 | 13:13 -> 17:18 | 4h05 | A0.3.7 | close the 2026-04-17 session at 17:15, reopen a fresh execution trace for today, and audit the remaining demo-readiness work from the current student-only product state |
| 2026-04-21 | 10:18 -> 12:00 | 1h42 | A0.3.7 P1.3 P2.7 P5.3 | close the 2026-04-20 session at 17:18, reopen a fresh execution trace for today, finish the pending pilot-log traceability slice, and continue the student workbench polish plus AI title and summary hardening work |
| 2026-04-21 | 14:48 -> 17:49 | 3h01 | A0.3.7 | reopen a fresh execution trace for today after the earlier 2026-04-21 session was explicitly closed |
| 2026-04-22 | 10:33 -> 12:32 | 1h59 | A0.3.7 | close the 2026-04-21 session at 17:49 and reopen a fresh execution trace for today |
| 2026-04-22 | 14:02 -> 18:01 | 3h59 | A0.3.7 | split the 2026-04-22 execution trace at 12:32 and reopen a fresh work-session row from 14:02 |
| 2026-04-23 | 14:57 -> 17:11 | 2h14 | A0.3.7 P1.3 P5.3 | close the 2026-04-22 session at 18:01, then investigate production PDF extraction and workspace-sync failures, harden retry behavior, and capture the Windows search-tool workflow note |
| 2026-04-28 | 11:34 -> OPEN | OPEN | A0.3.7 P1.3 P2.7 P2.8 | reopen the execution trace after a full operating-doc context rebuild, with next focus on partial PDF extraction, subject-wide uploads, and active tutoring context retention |
