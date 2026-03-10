# AGENTS.md

Primary references: [README.md](README.md) | [Implementation plan](docs/implementation_plan.md) | [MVP to-do list](docs/mvp_todo.md) | [Decision log](docs/decision_log.md) | [Work sessions log](docs/work_sessions.md)

This repository is being built as a long-term AI-assisted software project. The main failure mode is not raw coding quality. It is traceability loss: code, docs, prompts, scripts, and operating rules drifting out of sync until future sessions build on incomplete context.

This file defines the mandatory operating system for all future agents and sessions.

## Non-Negotiable Rules

1. Read the current project state before making plans or code changes.
2. Never create an orphan artifact. Every new script, doc, SQL file, prompt file, or meta file must be linked from at least one existing source-of-truth document.
3. Every meaningful change must map back to a task ID from [docs/mvp_todo.md](docs/mvp_todo.md).
4. Any change that affects architecture, schema, auth, AI behavior, billing, moderation, or operating workflow must be logged in [docs/decision_log.md](docs/decision_log.md).
5. Every work session must appear in [docs/work_sessions.md](docs/work_sessions.md).
6. If code and docs drift, fix the drift in the same session or leave an explicit follow-up task in [docs/mvp_todo.md](docs/mvp_todo.md).
7. Prefer explicit, boring, reviewable structure over clever abstractions.
8. Do not create god components, god hooks, god services, or god utility files.

## Mandatory Read Order At Session Start

Read these in order before any substantial implementation work:

1. [README.md](README.md)
2. [docs/implementation_plan.md](docs/implementation_plan.md)
3. [docs/brief_adjustments.md](docs/brief_adjustments.md)
4. [docs/branch_pr_conventions.md](docs/branch_pr_conventions.md)
5. [docs/role_access_matrix.md](docs/role_access_matrix.md)
6. [docs/environment_matrix.md](docs/environment_matrix.md)
7. [docs/supabase_project_setup.md](docs/supabase_project_setup.md)
8. [docs/supabase_schema_v1.md](docs/supabase_schema_v1.md)
9. [docs/access_rules_v1.md](docs/access_rules_v1.md)
10. [docs/api_route_map.md](docs/api_route_map.md)
11. [docs/app_shell_v1.md](docs/app_shell_v1.md) when layout, dashboard, or navigation work is in scope
12. [docs/student_dashboard_v1.md](docs/student_dashboard_v1.md) when student-dashboard work is in scope
13. [docs/student_intake_v1.md](docs/student_intake_v1.md) when intake, upload staging, or extracted-text review is in scope
14. [docs/student_session_persistence_v1.md](docs/student_session_persistence_v1.md) when conversation persistence or return-to-session behavior is in scope
15. [docs/student_workbench_v1.md](docs/student_workbench_v1.md) when chat, workspace, or student coaching surfaces are in scope
16. [docs/student_history_summary_v1.md](docs/student_history_summary_v1.md) when history, completion, or summary work is in scope
17. [docs/invitation_flows_v1.md](docs/invitation_flows_v1.md) when auth, parent, or tutor link work is in scope
18. [docs/service_interfaces.md](docs/service_interfaces.md)
19. [docs/error_audit_conventions.md](docs/error_audit_conventions.md)
20. [docs/storage_attachment_rules.md](docs/storage_attachment_rules.md)
21. [docs/rls_fixture_verification.md](docs/rls_fixture_verification.md) when auth, schema, or RLS work is in scope
22. [docs/sample_attachment_corpus.md](docs/sample_attachment_corpus.md) when upload, extraction, or demo fixture work is in scope
23. [docs/minors_privacy_baseline.md](docs/minors_privacy_baseline.md)
24. [docs/mvp_todo.md](docs/mvp_todo.md)
25. [docs/mvp_timeline.md](docs/mvp_timeline.md)
26. [docs/decision_log.md](docs/decision_log.md)
27. [docs/work_sessions.md](docs/work_sessions.md)
28. The relevant code, SQL, prompt, or UI files for the task being worked on

If a file above is outdated, update it before or alongside the code change that depends on it.

## Session Protocol

### 1. Start Or Continue The Session Log

- Open [docs/work_sessions.md](docs/work_sessions.md) immediately.
- If there is already an `OPEN` session and the user has not explicitly said `end session`, continue that row instead of creating a second open session.
- If there is no open row, append a new row with the current date, start time, `OPEN` as the end marker, planned task IDs, and a short scope description.

### 2. Rebuild Context

- Confirm the current active phase and task IDs in [docs/mvp_todo.md](docs/mvp_todo.md).
- Review recent decisions in [docs/decision_log.md](docs/decision_log.md).
- Check whether the intended work changes architecture, contracts, prompts, or workflow. If yes, prepare a decision log update.

### 3. Implement In Vertical Slices

- Prefer completing a thin, reviewable workflow slice over scattering partial work across many areas.
- Keep student flow first, then adult visibility, then monetization and optional polish.
- Do not widen scope unless the to-do list and implementation plan are updated first.

### 4. Close The Traceability Loop

After any meaningful code or doc change:

- Update the relevant task checkboxes in [docs/mvp_todo.md](docs/mvp_todo.md).
- Add or update decision entries in [docs/decision_log.md](docs/decision_log.md) when the change affects structure or behavior.
- Update [README.md](README.md) if a new top-level artifact becomes important to future work.
- Update cross-links inside any new document or operating document.

### 5. End The Session Only On Explicit User Instruction

- Do not close a session row just because one assistant turn finished.
- Close the active row only when the user explicitly says `end session`.
- When closing a row, replace `OPEN` with the end time and add the computed duration.

## Required Logging

### Work Sessions

Use [docs/work_sessions.md](docs/work_sessions.md) for chronological execution trace.

Each entry must contain:

- date
- start and end time
- duration
- task IDs
- a short human-readable scope summary

### Decisions

Use [docs/decision_log.md](docs/decision_log.md) for project-shaping decisions.

Log a decision when changing:

- schema or RLS behavior
- role visibility rules
- API contracts
- provider selection or abstraction boundaries
- prompt strategy
- billing behavior
- moderation rules
- document workflow or operating process

## File Placement Rules

- Product and repo overview: repository root `README.md`
- Agent workflow: repository root `AGENTS.md`
- Planning and meta docs: `docs/`
- SQL and Supabase config: `supabase/`
- Scripts and automation: `scripts/`
- Source-controlled sample inputs and demo attachments: `fixtures/`
- App routes: `app/`
- Reusable UI: `components/`
- Shared libraries: `lib/`
- Shared types: `types/`
- Static assets: `public/`
- Tests: colocated where appropriate or in a dedicated `tests/` folder once test infrastructure exists

If a new folder becomes a stable part of the project, add it to [README.md](README.md) and, if process-relevant, here as well.

## Hyperlinking Rules

- Every long-lived markdown doc must start with links to its primary related docs.
- Every new top-level doc must be linked from [README.md](README.md).
- Every script or SQL artifact referenced in docs should be linked from the relevant planning or implementation document once it exists.
- Do not mention a future artifact in a decision or plan without also stating where it should live.

## Task ID Rules

- Use IDs exactly as written in [docs/mvp_todo.md](docs/mvp_todo.md).
- If new work does not fit an existing task, add the new task before implementing it.
- Reference task IDs in:
  - session log rows
  - decision entries
  - pull requests or commit messages
  - testing notes

## Audit Cadence

### Every Session

- Check whether the active task is still the highest-leverage next step.
- Check for doc drift between the implementation plan, to-do list, and current code.

### Every Completed Phase

- Review [docs/implementation_plan.md](docs/implementation_plan.md), [docs/mvp_timeline.md](docs/mvp_timeline.md), and [docs/mvp_todo.md](docs/mvp_todo.md).
- Archive or rewrite stale assumptions.
- Add any newly discovered risks or blockers.

### Before Any Beta Or External Demo

- Run the smoke checklist for the current MVP slice.
- Verify role separation and data visibility.
- Verify iPad layout and upload behavior.
- Verify that the session and decision logs explain the current product state.

## Quality Bar

- Prefer simple data flow.
- Prefer explicit server-side access checks even when RLS already exists.
- Prefer small files over giant all-in-one files.
- Prefer typed interfaces over hidden implicit shapes.
- Prefer stable, swappable service boundaries for AI, uploads, and billing.
- Prefer domain modules with narrow responsibilities over catch-all folders and mega-files.
- Keep UI components mostly presentational when possible; move data loading, orchestration, and policy logic into route, server, or service layers.
- Split a file when it starts mixing layout, fetching, mutation handling, and domain logic in the same place.

Avoid:

- silent behavior changes
- undocumented schema changes
- hidden prompt files
- ad hoc scripts with no doc link
- UI work that outruns data contracts
- broad refactors without a logged reason
- components that own too many concerns
- service files that become hidden second applications

## Definition Of Done

A task is only done when:

1. The implementation works for the intended role and flow.
2. The relevant tests or smoke checks pass, or the gap is explicitly documented.
3. The to-do list reflects the new state.
4. Any structural decision is logged.
5. New artifacts are linked from the right docs.
6. The next agent can infer what happened without reconstructing it from git history alone.
