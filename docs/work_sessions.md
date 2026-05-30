# Work Sessions Log

Related: [README](../README.md) | [AGENTS](../AGENTS.md) | [MVP to-do list](mvp_todo.md) | [Pilot_todo](pilot_todo.md)

Timezone for this log: `Asia/Taipei`

## Rules

- Start a session row when a new work session begins.
- If the latest row is still `OPEN` and the user has not explicitly said `end session`, continue the same row.
- Close a session row only when the user explicitly says `end session`.
- Always include task IDs from [the MVP to-do list](mvp_todo.md) or [Pilot_todo](pilot_todo.md), depending on the active work lane.
- Keep the active `OPEN` row and recent closed rows here; move older closed rows to archive files only when they are copied verbatim and linked below.

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


## Archive

- Historical closed rows through `2026-04-30 11:13` were moved verbatim to [Work sessions archive 2026-03 to 2026-04](archive/work_sessions_2026-03_to_2026-04.md).
- Keep the active `OPEN` row and recent closed rows in this file; move older closed rows to archive files only without rewriting their content.

## Log

| Date | Time | Duration | Task IDs | Scope |
| --- | --- | --- | --- | --- |
| 2026-04-30 | 20:34 -> 22:10 | 1h36 | A0.3.7 P1.3 P2.7 P6.6 P6.7 P6.8 | reopen the execution trace after closing the 2026-04-30 morning subject-doc session, continue subject-doc cap, validation, workspace resource UI polish, close the first subject-doc feature version with remaining follow-ups moved to P6, and tighten live composer upload feedback |
| 2026-05-06 | 16:59 -> 18:32 | 1h33 | A0.3.7 P1.3 P2.7 | cancel the mistaken 2026-05-05 22:34 reopen, open a fresh execution trace, tune the student left-rail activity sequence, correct the Dashboard/disabled-section rail styling, add subject recent-chat expanders, try hover-revealed future-section descriptions without rail height shifts, polish subject-resource card controls, disable subject-resource uploads when the account upload quota is exhausted, and split Dashboard into a section-card overview distinct from Homework |
| 2026-05-07 | 00:17 -> 01:16 | 0h59 | A0.3.7 P1.3 | close the 2026-05-06 work session at 18:32, reopen a fresh execution trace, and polish the student Dashboard cards with product-facing copy, matching icons, and the Homework subject row layout |
| 2026-05-07 | 09:18 -> 11:56 | 2h38 | A0.3.7 P1.3 | close the 2026-05-07 dashboard-polish session at 01:16, reopen a fresh execution trace, and prepare the public landing page revamp brief |
| 2026-05-07 | 15:18 -> 17:36 | 2h18 | A0.3.7 P1.3 | close the public landing brief-prep session at 11:56, reopen a fresh execution trace, and revamp the public landing page from the identity-aware brief |
| 2026-05-07 | 20:43 -> 20:57 | 0h14 | A0.3.7 P1.3 | reopen a fresh execution trace and standardize landing feature sections around a large GIF plus three cards for Parent and Tutor views |
| 2026-05-08 | 11:05 -> 11:19 | 0h14 | A0.3.7 P1.3 | correct the 2026-05-07 landing session timeline, reopen the current execution trace, and move the landing identity selector into the navbar with a compact pricing shortcut |
| 2026-05-08 | 14:33 -> 16:23 | 1h50 | A0.3.7 P1.3 | close the 2026-05-08 landing-navbar session at 11:19, reopen the current execution trace, and polish the landing hero, oversight overlay, CTA, help menu, centered hero, and alternating feature rows |
| 2026-05-11 | 10:40 -> 19:30 | 8h50 | A0.3.7 P1.3 P2.4 | cancel the mistaken 2026-05-10 reopen, open the current execution trace, restore the first Parent landing feature's documented comparison layout, continue landing/pricing polish, return to student dashboard spacing plus the Level up! layout, show signed-in email on profile surfaces, log the future cross-subject practice feature, decouple the landing header width from body padding, add dashboard subject status chips, simplify Dashboard/Homework header/title copy, make the Homework root unselected with editable subject shortcuts, tune the Dashboard title plus status-chip theme colors, and locally filter the root Homework quick-start by selected subject |
| 2026-05-12 | 15:15 -> 18:34 | 3h19 | A0.3.7 P1.3 P2.4 P6 | close the 2026-05-11 execution trace at 19:30, reopen the current work session, synchronize Homework subject selection into the URL without route loading, resync the selected subject when external rail links change the subject URL, intercept same-page Homework rail subject clicks for instant local switching, lazy-load subject-resource libraries per selected subject, log post-pilot homework checkpoint and cleanup safeguards, add active-homework counters to the rail plus Homework lists, and compact Homework row status display |
| 2026-05-12 | 20:45 -> 22:29 | 1h44 | A0.3.7 A2.1.1 A6.4.1 A6.4.2 P1.3 P2.4 P6 | reopen the current execution trace after closing the Homework workflow and counter-polish session, finish and push the Homework-section UI polish, log the demo-data utility follow-up for populating account homework by subject and status, simplify plus polish the `/app/settings` account surface, and explain why random undeliverable signup email domains can be rejected |
| 2026-05-13 | 09:17 -> 10:13 | 0h56 | A0.3.7 A2.1.1 A2.2.3 P1.3 P2.6 | reopen the current execution trace after closing the 2026-05-12 evening settings and signup-validation session, then simplify auth/onboarding chrome and persist the new learner onboarding fields |
| 2026-05-18 | 11:48 -> 11:48 | 0h00 | A0.3.7 | cancel the stale 2026-05-18 session opening before reopening a fresh trace |
| 2026-05-31 | 00:03 -> OPEN | OPEN | A0.3.7 P4.2 | reopen the current execution trace, assess docs organization, and archive older work-session rows while preserving the current canonical log |
