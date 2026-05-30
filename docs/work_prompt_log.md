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
- Use actual wall-clock start and end times for the prompt; do not infer durations from rough assistant progress messages.
- Do not merge several prompts into one row unless the exact prompt boundaries are already lost; if that happens, mark the row as approximate in the scope.
- Create the row immediately when prompt handling starts, with `OPEN` as the temporary end marker, then close that same row only after the work is actually finished and just before the final response.
- Do not pre-close a prompt row during analysis, planning, or mid-turn status updates. A prompt row must stay `OPEN` for the whole active handling window.
- Keep active `OPEN` prompt rows and recent closed rows here; move older closed rows to archive files only when they are copied verbatim and linked below.

## Format

`YYYY-MM-DD | HH:mm -> OPEN | OPEN | A0.0 P1.0 | short human-readable scope | 90%`

then close it as:

`YYYY-MM-DD | HH:mm -> HH:mm | 0h00 | A0.0 P1.0 | short human-readable scope | 90%`


## Archive

- Historical closed prompt rows through `2026-04-30` were moved verbatim to [Prompt work archive 2026-03 to 2026-04](archive/work_prompt_log_2026-03_to_2026-04.md).
- Keep active `OPEN` prompt rows and recent closed prompt rows in this file; move older closed rows to archive files only without rewriting their content.

## Log

| Date | Time | Duration | Task IDs | Scope | Credits Left |
| --- | --- | --- | --- | --- | --- |
| 2026-05-05 | 22:34 -> 22:35 | 0h01 | A0.3.7 | close the 2026-04-30 work session at 22:10 and reopen a fresh execution trace | | |
| 2026-05-06 | 16:59 -> 17:00 | 0h01 | A0.3.7 | cancel the mistaken 2026-05-05 22:34 work-session reopen and open a fresh execution trace | | |
| 2026-05-06 | 17:01 -> 17:06 | 0h05 | P1.3 | reorder the student left rail, disable future sections, swap Forward to a rocket icon, and align the Homework chevron | | |
| 2026-05-06 | 17:18 -> 17:19 | 0h01 | P1.3 | restore the Dashboard rail row, add a divider after Tests, and give disabled rail sections a wait cursor with coming-soon tooltip | | |
| 2026-05-06 | 17:39 -> 17:43 | 0h04 | P1.3 | replace subject row plus actions with aligned chevrons that expand recent conversation titles and add the Homework divider | | |
| 2026-05-06 | 17:58 -> 18:01 | 0h03 | P1.3 | align future-section labels with icons and reveal their descriptions only on hover without changing rail height | | |
| 2026-05-06 | 18:10 -> 18:13 | 0h03 | P1.3 P2.7 | tighten future-section rail spacing and move subject-resource info/delete controls into the requested header positions | | |
| 2026-05-06 | 18:20 -> 18:24 | 0h04 | P2.7 | disable subject-page add-resource when the account upload quota is exhausted and show an informational tooltip | | |
| 2026-05-06 | 18:27 -> 18:32 | 0h05 | P1.3 | split the student Dashboard view from Homework and render dashboard cards for the left-rail learning sections | | |
| 2026-05-07 | 00:17 -> 00:17 | 0h00 | A0.3.7 | close the previous work session at 18:32 and reopen the execution trace | | |
| 2026-05-07 | 00:32 -> 00:37 | 0h05 | P1.3 | replace dashboard card copy with product-facing descriptions and restructure the dashboard card grid | | |
| 2026-05-07 | 00:59 -> 01:02 | 0h03 | P1.3 | add dashboard card icons, adjust the Homework card copy, and arrange subject chips in three right-aligned rows | | |
| 2026-05-07 | 01:15 -> 01:16 | 0h01 | P1.3 | show all configured subjects on the Dashboard Homework card even when some subjects have no conversations yet | | |
| 2026-05-07 | 09:18 -> 09:19 | 0h01 | A0.3.7 | close the active work session at 01:16 and reopen a fresh execution trace | | |
| 2026-05-07 | 09:33 -> 09:34 | 0h01 | A0.3.7 | synthesize current project goals, shipped features, open blockers, and future directions for LLM advisory context | | |
| 2026-05-07 | 10:32 -> 10:35 | 0h03 | P1.3 | create a paste-ready public landing page revamp brief and link it from the source-of-truth docs | | |
| 2026-05-07 | 15:18 -> 15:19 | 0h01 | A0.3.7 P1.3 | close the public landing brief-prep session at 11:56 and reopen a fresh execution trace while specs are still being drafted | | |
| 2026-05-07 | 17:14 -> 17:36 | 0h22 | P1.3 | revamp the public landing page from the new brief, including navbar and identity-specific first-visitor content | | |
| 2026-05-07 | 20:43 -> 20:43 | 0h00 | A0.3.7 P1.3 | close the landing revamp work session at 17:36 and reopen a fresh execution trace | | |
| 2026-05-07 | 20:49 -> 20:57 | 0h08 | P1.3 | standardize landing feature sections around a large GIF plus three cards and adapt Parent/Tutor views | | |
| 2026-05-08 | 11:05 -> 11:05 | 0h00 | A0.3.7 | correct the 2026-05-07 landing session timeline and reopen the current execution trace | | |
| 2026-05-08 | 11:08 -> 11:19 | 0h11 | P1.3 | move the landing identity selector into the navbar, add a compact pricing help button, and explain the hero workspace placeholder | | |
| 2026-05-08 | 14:33 -> 14:33 | 0h00 | A0.3.7 | close the 2026-05-08 landing-navbar session at 11:19 and reopen the current execution trace | | |
| 2026-05-08 | 15:51 -> 16:01 | 0h10 | P1.3 | remove the landing hero workspace card, convert oversight copy to an overlay, remove hero sign-in, and turn the `?` pricing shortcut into a menu | | |
| 2026-05-08 | 16:14 -> 16:18 | 0h04 | P1.3 | center the landing hero, remove hero eyebrow text, hide feature subtitles, and alternate feature media-card order | | |
| 2026-05-08 | 16:22 -> 16:23 | 0h01 | P1.3 | keep landing GIFs on the two-thirds width track even when feature order alternates | | |
| 2026-05-11 | 10:40 -> 10:40 | 0h00 | A0.3.7 | cancel the mistaken 2026-05-10 reopen and open the current execution trace | | |
| 2026-05-11 | 11:03 -> 11:11 | 0h08 | P1.3 | implement the documented special comparison layout for the first Parent landing feature | | |
| 2026-05-11 | 11:19 -> 11:26 | 0h07 | P1.3 | hide the Student landing bottom CTA, disable Tutor selection with tooltip/toast, and widen landing side padding | | |
| 2026-05-11 | 11:33 -> 11:37 | 0h04 | P1.3 | keep the Tutor-unavailable toast out of header layout and double the landing viewport side padding | | |
| 2026-05-11 | 11:38 -> 11:48 | 0h10 | P1.3 | use a dashboard image for Parent landing feature 2 and limit doubled landing side padding to desktop | | |
| 2026-05-11 | 12:26 -> 12:34 | 0h08 | P1.3 | align the pricing page with the landing shell and fix the landing help dropdown placement | | |
| 2026-05-11 | 12:58 -> 13:02 | 0h04 | P1.3 | use a conversation workspace image for Parent landing features 3 and 4 and make the help menu hover-centered | | |
| 2026-05-11 | 13:14 -> 13:19 | 0h05 | P1.3 | convert pricing into identity-specific plan cards with yearly default and per-card account CTAs | | |
| 2026-05-11 | 13:21 -> 13:23 | 0h02 | P1.3 | disable the Tutor selector on pricing so future tutor cards cannot be displayed yet | | |
| 2026-05-11 | 13:25 -> 13:29 | 0h04 | P1.3 | refine pricing CTAs, paid-plan perk rows, and inline billing toggle placement | | |
| 2026-05-11 | 13:31 -> 13:33 | 0h02 | P1.3 | align pricing-card rows and prevent the billing toggle from changing row height | | |
| 2026-05-11 | 13:38 -> 13:43 | 0h05 | P1.3 | translate and wire the current public landing interface into French and Chinese | | |
| 2026-05-11 | 15:51 -> 16:18 | 0h27 | P1.3 | align student workspace headers, revise dashboard layout, and assess the next-challenge feature | | |
| 2026-05-11 | 16:19 -> 16:23 | 0h04 | P1.3 | show the signed-in email address on profile/settings surfaces | | |
| 2026-05-11 | 16:24 -> 16:27 | 0h03 | P1.3 P2.4 | rename and log the Level up! cross-subject practice idea, then build-test and push | | |
| 2026-05-11 | 16:30 -> 16:31 | 0h01 | P1.3 | decouple the public landing header width from the widened landing body padding | | |
| 2026-05-11 | 16:35 -> 16:38 | 0h03 | P1.3 | color dashboard subject buttons by homework status and add active-count badges | | |
| 2026-05-11 | 16:41 -> 16:44 | 0h03 | P1.3 | remove redundant student Dashboard/Homework header second lines and retitle the Dashboard page | | |
| 2026-05-11 | 16:47 -> 16:48 | 0h01 | P1.3 | make dashboard subject status chips readable in dark mode | | |
| 2026-05-11 | 16:51 -> 16:57 | 0h06 | P1.3 | make the homework root unselected by default with editable subject shortcuts and all recent chats | | |
| 2026-05-11 | 17:00 -> 19:02 | 2h02 | P1.3 | restore light-mode dashboard subject-chip colors and update the Dashboard title | | |
| 2026-05-11 | 19:02 -> 19:08 | 0h06 | P1.3 | harmonize the homework root and per-subject views with faster local subject filtering | | |
| 2026-05-11 | 19:27 -> 19:29 | 0h02 | P1.3 | replace the Dashboard title's literal victory text with a visual emoji marker | | |
| 2026-05-11 | 19:29 -> 19:30 | 0h01 | P1.3 | close the subject-options dropdown on outside click | | |
| 2026-05-12 | 15:15 -> 15:16 | 0h01 | A0.3.7 P1.3 P2.4 | close the previous work session and reopen the current trace | | |
| 2026-05-12 | 15:24 -> 15:25 | 0h01 | P1.3 | explain URL synchronization options for snappy homework subject switching | | |
| 2026-05-12 | 15:34 -> 15:41 | 0h07 | P1.3 | synchronize Homework subject selection into the URL without route loading | | |
| 2026-05-12 | 16:00 -> 16:02 | 0h02 | P1.3 | resync Homework subject highlighting when external rail links change the subject URL | | |
| 2026-05-12 | 16:20 -> 16:21 | 0h01 | P1.3 | assess strategies to reduce left-rail subject switch latency | | |
| 2026-05-12 | 16:39 -> 16:52 | 0h13 | P1.3 | intercept Homework rail subject clicks for instant local switching and reduce subject-resource loading | | |
| 2026-05-12 | 17:05 -> 17:05 | 0h00 | P1.3 | confirm the Homework subject-switching slice is complete, then stage, commit, and push the updated implementation and docs | | |
| 2026-05-12 | 18:01 -> 18:12 | 0h11 | P1.3 P2.4 P6 | log post-pilot homework workflow safeguards, then add active-homework counters to the rail, Homework subject chips, and homework list | | |
| 2026-05-12 | 18:25 -> 18:29 | 0h04 | P1.3 | compact Homework list rows and remove the subject-page Homework tab counter | | |
| 2026-05-12 | 18:32 -> 18:34 | 0h02 | P1.3 | shrink Homework status pills back to the previous lightweight row style | | |
| 2026-05-12 | 20:47 -> 20:49 | 0h02 | P1.3 | restore compact color and contour styling on Homework status pills and fix the French completed label gender | | |
| 2026-05-12 | 20:55 -> 20:56 | 0h01 | P1.3 | reverse the last Homework status-pill styling change while keeping the French completed label correction | | |
| 2026-05-12 | 20:59 -> 21:01 | 0h02 | P1.3 | restore Homework status-pill color and outline while keeping the normal row font size | | |
| 2026-05-12 | 21:05 -> 21:06 | 0h01 | P1.3 | align root Homework row subject labels inline before a fixed-width date column | | |
| 2026-05-12 | 21:18 -> 21:20 | 0h02 | P1.3 P2.4 P6 | test the completed Homework section polish, then commit and push | | |
| 2026-05-12 | 21:32 -> 21:34 | 0h02 | P1.3 | log a demo-data utility follow-up for populating account homework by subject and status | | |
| 2026-05-12 | 21:49 -> 22:01 | 0h12 | A6.4.1 A6.4.2 P1.3 | simplify the `/app/settings` profile, account, linked-account, and deletion-control surface | | |
| 2026-05-12 | 22:10 -> 22:13 | 0h03 | A6.4.1 P1.3 | polish `/app/settings` linked-account actions, deletion layout, and subscription link placement | | |
| 2026-05-12 | 22:18 -> 22:21 | 0h03 | A6.4.1 P1.3 | rename the settings header, add the external-link icon to upgrade options, then commit and push the settings slice | | |
| 2026-05-12 | 22:29 -> 22:29 | 0h00 | A2.1.1 | explain why a random signup email can be rejected as invalid despite syntactic email shape | | |
| 2026-05-13 | 09:17 -> 09:17 | 0h00 | A0.3.7 | close the current work session at 22:29 on 2026-05-12 and reopen a fresh session now | | |
| 2026-05-13 | 09:18 -> 09:20 | 0h02 | A2.1.1 P1.3 P2.6 | assess auth and onboarding simplification, registration field changes, and related planning tasks | | |
| 2026-05-13 | 09:53 -> 10:11 | 0h18 | A2.1.1 A2.2.3 P1.3 P2.6 | simplify auth/onboarding chrome and persist the new learner onboarding fields | | |
| 2026-05-18 | 11:48 -> 11:48 | 0h00 | A0.3.7 | cancel the mistaken 2026-05-15 reopen and open the current work session now | | |
| 2026-05-31 | 00:03 -> 00:04 | 0h01 | A0.3.7 | cancel the stale open work session, reopen the trace, and assess docs organization | | |
| 2026-05-31 | 00:13 -> 00:14 | 0h01 | A0.3.7 P4.2 | recommend current-plus-archive handling for logs and a bounded Pilot_todo split | | |
| 2026-05-31 | 01:04 -> 01:06 | 0h02 | A0.3.7 P4.2 | archive older work-session rows while keeping the canonical current log stable | | |
| 2026-05-31 | 01:07 -> 01:09 | 0h02 | A0.3.7 P4.2 | archive older prompt-log rows while keeping the experimental current trace stable | | |
| 2026-05-31 | 01:12 -> 01:17 | 0h05 | A0.3.7 P4.2 | split the Pilot_todo working board from long-form pilot evidence docs and record doc-only git handling | | |
| 2026-05-31 | 01:19 -> 01:39 | 0h20 | A0.3.7 P4.2 | audit stale docs candidates for review or archive after log and pilot-board cleanup | | |
| 2026-05-31 | 01:42 -> 01:43 | 0h01 | A0.3.7 P4.2 | assess whether remaining MVP to-do items should move into Pilot planning | | |
| 2026-05-31 | 01:54 -> 01:58 | 0h04 | A0.3.7 P6.12 | defer iPad-specific MVP exit tasks into post-pilot planning due to practical constraints | | |
